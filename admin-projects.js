// Global projects array
let projects = [];

// Authentication check - Updated with better error handling
async function checkAuth() {
    try {
        // Check session storage first for faster response
        if (sessionStorage.getItem('isAuthenticated') === 'true' && 
            sessionStorage.getItem('isAdmin') === 'true') {
            return true;
        }

        // Verify with server
        const response = await fetch('/api/check-session', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Authentication check failed');
        }
        
        const data = await response.json();
        
        if (!data.isAuthenticated) {
            console.log('Not authenticated, redirecting to login');
            window.location.href = './login.html';
            return false;
        }
        
        if (!data.isAdmin) {
            console.log('Not an admin, redirecting to home');
            window.location.href = './index.html';
            return false;
        }
        
        // Store authentication state
        sessionStorage.setItem('isAuthenticated', 'true');
        sessionStorage.setItem('isAdmin', 'true');
        
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = './login.html';
        return false;
    }
}

// Load projects directly from server API
async function loadProjects() {
    try {
        // Show loading indicator
        showFeedback('Loading projects...', 'info');
        
        // Get projects from API
        const response = await fetch('/api/projects', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load projects');
        }
        
        const data = await response.json();
        projects = data || [];
        
        // If no projects found, try to extract from HTML as fallback
        if (projects.length === 0) {
            await loadProjectsFromHtml();
        } else {
            renderProjects();
            ensureStatusVisibility(); // Ensure statuses are visible
            showFeedback('Projects loaded successfully!', 'success');
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        showFeedback('Error loading projects. Trying fallback method...', 'error');
        
        // Fallback to loading from HTML
        await loadProjectsFromHtml();
    }
}

// Fallback: Load projects from HTML
async function loadProjectsFromHtml() {
    try {
        const response = await fetch('index.html');
        const html = await response.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const projectCards = doc.querySelectorAll('.project-card');
        projects = Array.from(projectCards).map(card => ({
            id: generateId(),
            title: card.getAttribute('data-project-title'),
            description: card.getAttribute('data-project-desc'),
            image: card.getAttribute('data-project-img'),
            shortDescription: card.querySelector('.project-info p').textContent,
            status: card.querySelector('.status-badge')?.textContent || ''
        }));
        
        if (projects.length > 0) {
            // Save extracted projects to server
            await saveProjectsToServer();
            renderProjects();
            ensureStatusVisibility(); // Ensure statuses are visible
            showFeedback('Projects loaded from HTML successfully!', 'success');
        } else {
            // No projects found in HTML either
            showFeedback('No projects found. Start by adding a new project.', 'info');
        }
    } catch (error) {
        console.error('Error loading projects from HTML:', error);
        showFeedback('Error loading projects. Please create new projects.', 'error');
    }
}

// Render projects in the admin interface
function renderProjects() {
    const projectList = document.getElementById('project-list');
    projectList.innerHTML = '';
    
    // Add the new project card first
    const newProjectCard = document.createElement('div');
    newProjectCard.className = 'new-project-card';
    newProjectCard.id = 'add-project-card';
    newProjectCard.innerHTML = '<i class="fas fa-plus-circle"></i>';
    newProjectCard.addEventListener('click', () => {
        resetForm();
        document.querySelector('.project-form').scrollIntoView({ behavior: 'smooth' });
    });
    projectList.appendChild(newProjectCard);
    
    // Then add existing projects
    projects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card-admin';
        
        // Create status badge with explicit styling to ensure visibility
        const statusBadgeHtml = project.status ? 
            `<span class="status-badge" style="display:inline-block !important; visibility:visible !important; opacity:1 !important;">${project.status}</span>` 
            : '';
        
        projectCard.innerHTML = `
            <div class="project-actions">
                <button class="btn-icon btn-edit" onclick="editProject('${project.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-delete" onclick="deleteProject('${project.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <h3>${project.title}</h3>
            <p>${project.shortDescription}</p>
            ${statusBadgeHtml}
        `;
        projectList.appendChild(projectCard);
    });
}

// Function to ensure status visibility
function ensureStatusVisibility() {
    // Force visibility of all status badges on the page after render
    setTimeout(() => {
        const statusBadges = document.querySelectorAll('.status-badge');
        statusBadges.forEach(badge => {
            badge.style.display = 'inline-block';
            badge.style.visibility = 'visible';
            badge.style.opacity = '1';
        });
        
        // Ensure status input is visible
        const statusInput = document.getElementById('project-status');
        if (statusInput) {
            statusInput.style.display = 'block';
            statusInput.style.visibility = 'visible';
            statusInput.style.opacity = '1';
        }
    }, 100);
}

// Save a project (add or update)
async function saveProject(e) {
    e.preventDefault();
    
    const id = document.getElementById('project-id').value || generateId();
    const title = document.getElementById('project-title').value;
    const description = document.getElementById('project-desc').value;
    const status = document.getElementById('project-status').value.trim(); // Trim whitespace
    
    // Extract the first sentence or first 100 characters for short description
    let shortDescription = description.split('.')[0];
    // Ensure the short description ends with a period
    if (!shortDescription.endsWith('.')) {
        shortDescription += '.';
    }
    // If shortDescription is too long, truncate it
    if (shortDescription.length > 150) {
        shortDescription = shortDescription.substring(0, 147) + '...';
    }
    
    // Get image from file or URL
    let image = document.getElementById('project-img').value;
    const imageFile = document.getElementById('project-img-file').files[0];
    
    try {
        // Handle image upload if file is selected
        if (imageFile) {
            showFeedback('Uploading image...', 'info');
            image = await uploadImage(imageFile);
        }
        
        // Validate image source
        if (!image) {
            throw new Error('Please provide an image URL or upload an image file');
        }
        
        // Create project object with correct status
        const project = { 
            id, 
            title, 
            description, 
            image, 
            shortDescription, 
            status: status || '' // Ensure status is never undefined
        };
        
        // Update or add
        const existingIndex = projects.findIndex(p => p.id === id);
        if (existingIndex >= 0) {
            projects[existingIndex] = project;
        } else {
            projects.push(project);
        }
        
        await saveProjectsToServer();
        renderProjects();
        ensureStatusVisibility(); // Call after rendering
        resetForm();
        showFeedback('Project saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving project:', error);
        showFeedback('Error saving project: ' + error.message, 'error');
    }
}

// Update the uploadImage function with size validation and compression
async function uploadImage(file) {
    return new Promise((resolve, reject) => {
        // Strict size limit of 5MB
        if (file.size > 5 * 1024 * 1024) {
            reject(new Error('Image size must be less than 5MB'));
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Calculate new dimensions (max 800px width/height)
                let width = img.width;
                let height = img.height;
                const maxSize = 800;
                
                if (width > maxSize || height > maxSize) {
                    if (width > height) {
                        height = (height * maxSize) / width;
                        width = maxSize;
                    } else {
                        width = (width * maxSize) / height;
                        height = maxSize;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw and compress image with higher compression
                ctx.drawImage(img, 0, 0, width, height);
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6); // Increased compression
                
                // Verify final size
                const base64str = compressedDataUrl.split(',')[1];
                const decoded = atob(base64str);
                if (decoded.length > 2 * 1024 * 1024) {
                    reject(new Error('Compressed image still too large. Please use a smaller image.'));
                    return;
                }
                
                resolve(compressedDataUrl);
            };
            
            img.onerror = function() {
                reject(new Error('Failed to load image'));
            };
            
            img.src = e.target.result;
        };
        
        reader.onerror = function() {
            reject(new Error('Failed to read the image file'));
        };
        
        reader.readAsDataURL(file);
    });
}

// Update image preview handling
function updateImagePreview(src) {
    const imagePreview = document.getElementById('image-preview');
    imagePreview.style.display = 'none'; // Hide first
    
    // Show loading state
    showFeedback('Loading preview...', 'info');
    
    const img = new Image();
    img.onload = function() {
        imagePreview.src = src;
        imagePreview.style.display = 'block';
        showFeedback('Preview loaded', 'success');
    };
    
    img.onerror = function() {
        showFeedback('Failed to load image preview', 'error');
    };
    
    img.src = src;
}

// Edit a project
function editProject(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;
    
    document.getElementById('project-id').value = project.id;
    document.getElementById('project-title').value = project.title;
    document.getElementById('project-desc').value = project.description;
    document.getElementById('project-img').value = project.image;
    document.getElementById('project-status').value = project.status || '';
    
    // Clear any previously selected file
    document.getElementById('project-img-file').value = '';
    
    // Show image preview
    const imagePreview = document.getElementById('image-preview');
    if (project.image) {
        imagePreview.src = project.image;
        imagePreview.style.display = 'block';
        
        // If it's a data URL, it's already loaded. If not, make sure it loads properly
        imagePreview.onerror = function() {
            this.style.display = 'none';
            showFeedback('Failed to load image preview', 'error');
        };
    } else {
        imagePreview.style.display = 'none';
    }
    
    // Scroll to form
    document.querySelector('.project-form').scrollIntoView({ behavior: 'smooth' });
}

// Delete a project with modal confirmation
function deleteProject(id) {
    projectToDelete = id;
    
    const project = projects.find(p => p.id === id);
    if (project) {
        const deleteModal = document.getElementById('delete-modal');
        const modalText = deleteModal.querySelector('p');
        modalText.textContent = `Are you sure you want to delete "${project.title}"? This action cannot be undone.`;
        deleteModal.style.display = 'flex';

        // Setup confirm button handler
        const confirmButton = document.getElementById('delete-confirm');
        confirmButton.onclick = async function() {
            const index = projects.findIndex(p => p.id === projectToDelete);
            if (index >= 0) {
                projects.splice(index, 1);
                try {
                    await saveProjectsToServer();
                    renderProjects();
                    showFeedback('Project deleted successfully!', 'success');
                } catch (error) {
                    console.error('Error deleting project:', error);
                    showFeedback('Error deleting project. Please try again.', 'error');
                }
            }
            deleteModal.style.display = 'none';
            projectToDelete = null;
        };

        // Setup cancel button handler
        const cancelButton = document.getElementById('delete-cancel');
        cancelButton.onclick = function() {
            deleteModal.style.display = 'none';
            projectToDelete = null;
        };
    }
}

// Reset the form now called resetForm but serves as "Add Another Project"
function resetForm() {
    document.getElementById('project-form').reset();
    document.getElementById('project-id').value = '';
    document.getElementById('image-preview').style.display = 'none';
    
    // Clear file input and image preview
    document.getElementById('project-img-file').value = '';
    document.getElementById('project-img').value = '';
    
    // Scroll to form
    document.querySelector('.project-form').scrollIntoView({ behavior: 'smooth' });
    
    // Focus on title input for better UX
    document.getElementById('project-title').focus();
}

// Save projects to the server with enhanced error handling
async function saveProjectsToServer() {
    try {
        showFeedback('Saving projects...', 'info');
        
        // Clean up projects data
        const cleanedProjects = projects.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            image: p.image,
            shortDescription: p.shortDescription,
            status: p.status || ''
        }));
        
        const response = await fetch('/api/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(cleanedProjects)
        });
        
        if (!response.ok) {
            // Handle specific error cases
            if (response.status === 401) {
                sessionStorage.removeItem('isAuthenticated');
                sessionStorage.removeItem('isAdmin');
                window.location.href = './login.html';
                throw new Error('Authentication required. Please log in.');
            } else if (response.status === 403) {
                window.location.href = './index.html';
                throw new Error('You do not have permission to perform this action.');
            }
            
            const data = await response.json();
            throw new Error(data.message || 'Failed to save projects');
        }
        
        await response.json();
        showFeedback('Projects saved successfully!', 'success');
        return true;
    } catch (error) {
        console.error('Save error:', error);
        showFeedback('Error saving projects: ' + error.message, 'error');
        throw error;
    }
}

// Show feedback message with multiple types
function showFeedback(message, type) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = message;
    feedback.className = `feedback ${type || 'info'}`;
    feedback.style.display = 'block';
    
    if (type !== 'info') {
        setTimeout(() => {
            feedback.style.display = 'none';
        }, 3000);
    }
}

// Generate a unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Logout function
async function logout() {
    try {
        await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });
        sessionStorage.removeItem('isAuthenticated');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

// Set up DOM event listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Hide the content until authentication is verified
    document.querySelector('.admin-container').style.display = 'none';
    
    const isAuthorized = await checkAuth();
    if (!isAuthorized) return;
    
    // Show admin interface after auth check passes
    document.querySelector('.admin-container').style.display = 'block';
    
    // Hide preloader
    document.getElementById('preloader').style.display = 'none';
    
    // Load projects
    loadProjects();
    
    // Setup event listeners
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('project-form').addEventListener('submit', saveProject);
    document.getElementById('reset-form').addEventListener('click', resetForm);
    
    // Handle image preview with better error handling
    const imageFileInput = document.getElementById('project-img-file');
    const imageUrlInput = document.getElementById('project-img');
    const imagePreview = document.getElementById('image-preview');
    
    // Show preview when a file is selected
    imageFileInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                imagePreview.onerror = null; // Clear previous error handlers
                // Clear the URL input as we're using file
                imageUrlInput.value = '';
            };
            reader.onerror = function() {
                showFeedback('Error reading the selected file', 'error');
            };
            reader.readAsDataURL(file);
        } else {
            // Only hide if no URL is present
            if (!imageUrlInput.value) {
                imagePreview.style.display = 'none';
            }
        }
    });
    
    // Show preview when URL is entered
    imageUrlInput.addEventListener('input', function() {
        if (this.value) {
            imagePreview.src = this.value;
            imagePreview.style.display = 'block';
            
            // Set up error handling for the image
            imagePreview.onerror = function() {
                this.style.display = 'none';
                showFeedback('Failed to load image from URL', 'error');
            };
            
            // Clear the file input as we're using URL
            imageFileInput.value = '';
        } else {
            // Only hide if no file is selected
            if (!imageFileInput.files.length) {
                imagePreview.style.display = 'none';
            }
        }
    });
    
    // Add project card click handler
    document.getElementById('add-project-card').addEventListener('click', () => {
        resetForm();
        document.querySelector('.project-form').scrollIntoView({ behavior: 'smooth' });
    });
    
    // Add event listener for status field to ensure buttons remain accessible
    const statusInput = document.getElementById('project-status');
    statusInput.addEventListener('focus', function() {
        // Scroll to ensure buttons are visible when status is being edited
        setTimeout(() => {
            const btnRow = document.querySelector('.btn-row');
            if (btnRow) {
                btnRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 300);
    });
    
    // Call this after the page has loaded to ensure statuses are visible
    setTimeout(ensureStatusVisibility, 500);
    
    // Setup delete modal event listeners
    const deleteModal = document.getElementById('delete-modal');
    const cancelButton = document.getElementById('delete-cancel');
    const confirmButton = document.getElementById('delete-confirm');
    
    // Cancel button closes the modal
    cancelButton.addEventListener('click', function() {
        deleteModal.style.display = 'none';
        projectToDelete = null;
    });
    
    // Confirm button deletes the project
    confirmButton.addEventListener('click', async function() {
        if (projectToDelete) {
            const index = projects.findIndex(p => p.id === projectToDelete);
            if (index >= 0) {
                projects.splice(index, 1);
                
                try {
                    await saveProjectsToServer();
                    renderProjects();
                    showFeedback('Project deleted successfully!', 'success');
                } catch (error) {
                    console.error('Error deleting project:', error);
                    showFeedback('Error deleting project. Please try again.', 'error');
                }
            }
        }
        
        // Close modal and reset
        deleteModal.style.display = 'none';
        projectToDelete = null;
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === deleteModal) {
            deleteModal.style.display = 'none';
            projectToDelete = null;
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && deleteModal.style.display === 'flex') {
            deleteModal.style.display = 'none';
            projectToDelete = null;
        }
    });

    // Ensure admin styles take precedence
    function applyAdminStyles() {
        // Add admin-specific classes to buttons
        const buttons = document.querySelectorAll('.admin-container .btn');
        buttons.forEach(btn => {
            btn.classList.add('admin-btn');
            if (btn.classList.contains('btn-outline')) {
                btn.classList.add('admin-btn-outline');
            }
        });
        
        // Ensure status badges are visible
        ensureStatusVisibility();
    }
    
    // Call this after loading projects
    loadProjects().then(() => {
        applyAdminStyles();
    });
    
    // Call again after a slight delay to handle any race conditions
    setTimeout(applyAdminStyles, 800);
});
