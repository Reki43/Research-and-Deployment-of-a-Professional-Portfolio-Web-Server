// Authentication check
async function checkAuth() {
    try {
        // Clear existing auth data to force fresh check
        sessionStorage.removeItem('isAuthenticated');
        sessionStorage.removeItem('isAdmin');

        const response = await fetch('/api/check-session', {
            credentials: 'include'
        });
        const data = await response.json();
        
        console.log('Auth check response:', data);
        
        if (!data.isAuthenticated) {
            console.log('Not authenticated, redirecting to login');
            window.location.href = './login.html';
            return false;
        }
        
        sessionStorage.setItem('isAuthenticated', 'true');
        // Store admin status
        sessionStorage.setItem('isAdmin', data.isAdmin ? 'true' : 'false');
        
        console.log('Authentication successful, isAdmin:', data.isAdmin);
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = './login.html';
        return false;
    }
}

// Wait for DOM content to be loaded before checking auth
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication status
    await checkAuth();
    
    // Load projects from API if available
    try {
        const projectsSection = document.querySelector('#projects .projects-grid');
        if (projectsSection) {
            const response = await fetch('/api/projects');
            if (response.ok) {
                const projects = await response.json();
                if (projects && projects.length > 0) {
                    console.log(`Loaded ${projects.length} projects from API`);
                    
                    // Only update projects if we got data from API
                    updateProjectsInDOM(projects, projectsSection);
                }
            }
        }
    } catch (error) {
        console.error('Error loading projects from API:', error);
    }
    
    // Add admin controls if the user is an admin
    if (sessionStorage.getItem('isAdmin') === 'true') {
        addAdminControls();
    }
    
    // Add logout functionality to header
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu && sessionStorage.getItem('isAuthenticated') === 'true') {
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'btn';
        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
        logoutBtn.style.marginLeft = '1rem';
        logoutBtn.onclick = logout;
        navMenu.appendChild(logoutBtn);
    }
});

// Function to update projects in the DOM
function updateProjectsInDOM(projects, container) {
    if (!container) return;
    
    // Clear existing projects
    container.innerHTML = '';
    
    // Add each project
    projects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.setAttribute('data-project-title', project.title);
        projectCard.setAttribute('data-project-desc', project.description);
        projectCard.setAttribute('data-project-img', project.image);
        
        // Create the image element with error handling
        const img = document.createElement('img');
        img.alt = project.title;
        img.src = project.image;
        img.style.zIndex = "1"; // Ensure image has proper z-index
        img.onerror = function() {
            this.src = 'Images/placeholder.jpg'; // Use a placeholder image on error
            console.error('Failed to load image for project:', project.title);
        };
        
        // Create the project info
        const projectInfo = document.createElement('div');
        projectInfo.className = 'project-info';
        projectInfo.style.zIndex = "2"; // Ensure info has higher z-index than image
        projectInfo.style.position = "relative"; // Ensure position context is set
        
        // Create title with optional status badge
        const titleElement = document.createElement('h3');
        titleElement.textContent = project.title;
        
        if (project.status) {
            const statusBadge = document.createElement('span');
            statusBadge.className = 'status-badge';
            statusBadge.textContent = project.status;
            statusBadge.style.display = "inline-block"; // Force display
            statusBadge.style.visibility = "visible";   // Ensure visibility
            titleElement.appendChild(statusBadge);
        }
        
        // Create description 
        const descElement = document.createElement('p');
        descElement.textContent = project.shortDescription || project.description.split('.')[0] + '.';
        
        // Assemble the elements
        projectInfo.appendChild(titleElement);
        projectInfo.appendChild(descElement);
        
        projectCard.appendChild(img);
        projectCard.appendChild(projectInfo);
        
        // Force initial visibility
        projectCard.style.visibility = "visible";
        projectCard.style.opacity = "1";
        
        container.appendChild(projectCard);
    });
    
    // Re-attach event listeners with slight delay to ensure DOM is ready
    setTimeout(() => {
        attachProjectModalListeners();
    }, 100);
}

// Re-attach event listeners for project modals
function attachProjectModalListeners() {
    const projectCards = document.querySelectorAll('.project-card');
    const projectModal = document.getElementById('project-modal');
    const modalImg = document.getElementById('modal-img');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');
    
    projectCards.forEach(card => {
        // First remove any existing click event to avoid duplicates
        card.removeEventListener('click', handleProjectClick);
        
        // Then add the click event
        card.addEventListener('click', handleProjectClick);
    });
}

// Separate function for handling project card clicks
function handleProjectClick() {
    const projectModal = document.getElementById('project-modal');
    const modalImg = document.getElementById('modal-img');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');
    
    modalTitle.textContent = this.getAttribute('data-project-title');
    modalDesc.textContent = this.getAttribute('data-project-desc');
    modalImg.src = this.getAttribute('data-project-img');
    projectModal.style.display = 'flex';
}

// Add admin controls to the Projects section
function addAdminControls() {
    console.log('Adding admin controls - Function called');
    const projectsSection = document.querySelector('#projects');
    if (!projectsSection) {
        console.error('Projects section not found');
        return;
    }
    
    // Add an edit button to the Projects section header
    const projectsHeader = projectsSection.querySelector('h2');
    if (projectsHeader) {
        console.log('Found projects header, adding edit button');
        
        // Check if button already exists
        if (projectsHeader.querySelector('.admin-edit-btn')) {
            console.log('Edit button already exists');
            return;
        }
        
        const editButton = document.createElement('a');
        editButton.href = './admin-projects.html';
        editButton.className = 'btn btn-outline admin-edit-btn';
        editButton.innerHTML = '<i class="fas fa-edit"></i> Edit Projects';
        editButton.style.marginLeft = '15px';
        editButton.style.fontSize = '1rem';
        editButton.style.verticalAlign = 'middle';
        editButton.style.display = 'inline-block'; // Ensure it's visible
        projectsHeader.appendChild(editButton);
        console.log('Edit button added to projects section');
    } else {
        console.error('Projects header not found');
    }
}

// Logout functionality
async function logout() {
    try {
        await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });
        sessionStorage.removeItem('isAuthenticated');
        sessionStorage.removeItem('isAdmin');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

/* Preloader & Initialization */
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  preloader.style.opacity = '0';
  setTimeout(() => { preloader.style.display = 'none'; }, 500);

  // Initialize AOS for scroll animations
  AOS.init({ duration: 800, once: true });

  // Initialize Particles.js
  particlesJS('particles-js', {
    "particles": {
      "number": { "value": 60, "density": { "enable": true, "value_area": 800 } },
      "color": { "value": "#00AEEF" },
      "shape": { "type": "circle", "stroke": { "width": 0, "color": "#00AEEF" } },
      "opacity": { "value": 0.5, "random": true },
      "size": { "value": 3, "random": true },
      "line_linked": { "enable": true, "distance": 150, "color": "#00AEEF", "opacity": 0.4, "width": 1 },
      "move": { "enable": true, "speed": 2, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false }
    },
    "interactivity": {
      "detect_on": "canvas",
      "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": true, "mode": "push" } },
      "modes": { "grab": { "distance": 200, "line_linked": { "opacity": 0.7 } }, "push": { "particles_nb": 4 } }
    },
    "retina_detect": true
  });

  // EDIT: Your Typed.js Text - Single string for one-time typing
  new Typed('#typed-text', {
    strings: ['Computer Information Technology Student'],
    typeSpeed: 70,
    backSpeed: 40,
    backDelay: 2000,
    loop: false,
    showCursor: false
  });

  // Removed Typed.js initialization as the text is now static
});

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
  });
});

// Back to Top Button
const backToTopButton = document.createElement('button');
backToTopButton.id = 'back-to-top';
backToTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
document.body.appendChild(backToTopButton);

window.addEventListener('scroll', () => {
  if (window.scrollY > 300) backToTopButton.classList.add('show');
  else backToTopButton.classList.remove('show');
});

backToTopButton.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* Hamburger Menu Toggle */
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");
hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("show");
});

/* Navigation Highlight on Scroll */
const navItems = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 150;
    if (pageYOffset >= sectionTop) current = section.getAttribute('id');
  });
  navItems.forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('href').includes(current)) item.classList.add('active');
  });
});

/* Project Modal Functionality */
const projectModal = document.getElementById('project-modal');
const modalImg = document.getElementById('modal-img');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const closeModal = document.querySelector('.close-modal');

// Re-attach the initial event listeners after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    attachProjectModalListeners();
});

closeModal.addEventListener('click', () => {
  projectModal.style.display = 'none';
});
window.addEventListener('click', (e) => {
  if (e.target === projectModal) projectModal.style.display = 'none';
});

/* Resume Modal Functions */
function showResumeModal(event) {
  event.preventDefault();
  const resumeModal = document.getElementById('resume-modal');
  const iframe = document.getElementById('resume-preview');
  const errorDiv = document.getElementById('resume-error');
  
  // Test if PDF exists before showing modal
  fetch('resume.pdf')
    .then(response => {
      if (!response.ok) {
        throw new Error('PDF not found');
      }
      // PDF exists, show modal
      resumeModal.style.display = 'flex';
      iframe.style.display = 'block';
      errorDiv.style.display = 'none';
    })
    .catch(error => {
      console.error('Error loading PDF:', error);
      resumeModal.style.display = 'flex';
      iframe.style.display = 'none';
      errorDiv.style.display = 'block';
    });
}

function closeResumeModal() {
  const resumeModal = document.getElementById('resume-modal');
  resumeModal.style.display = 'none';
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
  const resumeModal = document.getElementById('resume-modal');
  if (e.target === resumeModal) {
    resumeModal.style.display = 'none';
  }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const resumeModal = document.getElementById('resume-modal');
    resumeModal.style.display = 'none';
  }
});

/* Resume Error Handling */
function handleResumeError() {
  const iframe = document.getElementById('resume-preview');
  const errorDiv = document.getElementById('resume-error');
  iframe.style.display = 'none';
  errorDiv.style.display = 'block';
}

/* Contact Form Submission */
const contactForm = document.getElementById('contact-form');
const formFeedback = document.getElementById('form-feedback');
contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  formFeedback.textContent = 'Message sent successfully!';
  contactForm.reset();
  setTimeout(() => { formFeedback.textContent = ''; }, 3000);
});

/* Enhanced Navigation Transform Logic */
const header = document.querySelector('header');
const sidebarNav = document.createElement('nav');
sidebarNav.className = 'sidebar-nav';

// Clone navigation items for sidebar
const navLinksClone = document.querySelector('.nav-links').cloneNode(true);
// Add icons to navigation items
navLinksClone.querySelectorAll('a').forEach(link => {
  const icon = document.createElement('i');
  switch(link.getAttribute('href')) {
    case '#home': icon.className = 'fas fa-home'; break;
    case '#about': icon.className = 'fas fa-user'; break;
    case '#skills': icon.className = 'fas fa-laptop-code'; break;
    case '#projects': icon.className = 'fas fa-project-diagram'; break;
    case '#contact': icon.className = 'fas fa-envelope'; break;
  }
  link.prepend(icon);
});
sidebarNav.appendChild(navLinksClone);

// Add social links to sidebar
const sidebarSocial = document.createElement('div');
sidebarSocial.className = 'sidebar-social';
sidebarSocial.innerHTML = `
  <a href="https://linkedin.com/in/henry-wong-ba1ab81aa" target="_blank" rel="noopener">
    <i class="fab fa-linkedin"></i>
  </a>
  <a href="https://github.com/Reki43" target="_blank" rel="noopener">
    <i class="fab fa-github"></i>
  </a>
`;
sidebarNav.appendChild(sidebarSocial);

document.body.appendChild(sidebarNav);

// Simplified scroll handling
let lastScroll = 0;
let isTransitioning = false;

window.addEventListener('scroll', () => {
  if (window.innerWidth <= 1200) {
    // Disable sidebar functionality on smaller screens
    return;
  }

  if (isTransitioning) return;
  
  const currentScroll = window.pageYOffset;
  
  if (currentScroll <= 50) {
    header.classList.remove('scrolled');
    sidebarNav.classList.remove('active');
    document.querySelectorAll('.section').forEach(section => {
      section.classList.remove('sidebar-active');
    });
  } else if (currentScroll > lastScroll && !header.classList.contains('scrolled')) {
    isTransitioning = true;
    header.classList.add('scrolled');
    
    setTimeout(() => {
      sidebarNav.classList.add('active');
      document.querySelectorAll('.section').forEach(section => {
        section.classList.add('sidebar-active');
      });
      isTransitioning = false;
    }, 300);
  }

  lastScroll = currentScroll;
  // ...rest of the scroll handler code...
});

// Add resize handler
window.addEventListener('resize', () => {
  if (window.innerWidth <= 1200) {
    sidebarNav.classList.remove('active');
    document.querySelectorAll('.section').forEach(section => {
      section.classList.remove('sidebar-active');
    });
  }
});

window.addEventListener('scroll', () => {
  if (isTransitioning) return;
  
  const currentScroll = window.pageYOffset;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  
  // Check if we're at the bottom of the page
  const isBottom = currentScroll + windowHeight >= documentHeight - 50; // 50px threshold
  
  if (currentScroll <= 50) {
    header.classList.remove('scrolled');
    setTimeout(() => {
      sidebarNav.classList.remove('active');
    }, 200);
  } else if (currentScroll > lastScroll && !header.classList.contains('scrolled')) {
    isTransitioning = true;
    header.classList.add('scrolled');
    
    setTimeout(() => {
      sidebarNav.classList.add('active');
      isTransitioning = false;
    }, 300);
  }

  lastScroll = currentScroll;
  
  // Update active section
  let currentSectionId = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 150;
    const sectionHeight = section.offsetHeight;
    
    // If we're at the bottom of the page, activate the contact section
    if (isBottom && section.id === 'contact') {
      currentSectionId = 'contact';
    }
    // Otherwise use normal scroll position detection
    else if (currentScroll >= sectionTop && currentScroll < sectionTop + sectionHeight) {
      currentSectionId = section.id;
    }
  });
  
  // Update active states in both navigations
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${currentSectionId}`) {
      link.classList.add('active');
    }
  });
});
