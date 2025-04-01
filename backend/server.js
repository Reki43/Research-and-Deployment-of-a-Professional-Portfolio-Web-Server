const express = require('express');
const session = require('express-session');
const cors = require('cors');
const passport = require('passport');
require('dotenv').config({ path: '../.env' }); // Specify the correct path to the .env file

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json({
    limit: '5mb',
    verify: (req, res, buf) => {
        try {
            const data = JSON.parse(buf);
            
            // Validate each project's image size
            if (Array.isArray(data)) {
                data.forEach(project => {
                    if (project.image && project.image.length > 5 * 1024 * 1024) { // 5MB limit
                        throw new Error('Project image too large (max 5MB)');
                    }
                });
            }
            
        } catch(e) {
            res.status(400).json({ message: e.message || 'Invalid JSON' });
            throw new Error(e.message || 'Invalid JSON');
        }
    }
}));

app.use(express.urlencoded({
    limit: '5mb',
    extended: true
}));

app.use(cors({
    origin: true,
    credentials: true
}));

// Serve static files from the project root
app.use(express.static('../'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Debug environment variables
console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID);
console.log('Google Callback URL:', process.env.GOOGLE_CALLBACK_URL);

// Import and use authentication module
require('./auth')(app);

// Legacy local auth (kept for backward compatibility)
const users = [
    {
        id: 1,
        email: 'henrywong228@hotmail.com',
        password: 'Henry2147'
    }
];

// Auth routes for local authentication
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    req.session.userId = user.id;
    req.session.isAdmin = true;  // All authenticated users are admins
    req.session.isAuthenticated = true;
    res.json({ message: 'Logged in successfully' });
});

// Middleware for authentication check
function requireAuth(req, res, next) {
    if (req.isAuthenticated() || req.session.userId) {
        return next();
    }
    return res.status(401).json({ message: 'Authentication required' });
}

// Modified middleware - all authenticated users can edit projects
// No separate admin check needed
function requireAdmin(req, res, next) {
    // All authenticated users are admins now
    return next();
}

// Import project data store
const projectsStore = require('./data/projects');

// Get all projects
app.get('/api/projects', (req, res) => {
    res.json(projectsStore.getAll());
});

// Protected route for updating projects - only requires authentication
app.post('/api/projects', requireAuth, (req, res) => {
    // Update projects
    const newProjects = req.body;
    
    // Update projects in the store without logging
    const updatedProjects = projectsStore.updateAll(newProjects);
    
    res.json({ 
        message: 'Projects updated successfully', 
        projects: updatedProjects
    });
});

// Generate HTML for index page based on projects
app.get('/api/generate-projects-html', requireAuth, (req, res) => {
    try {
        const projects = projectsStore.getAll();
        let projectsHtml = '';
        
        projects.forEach(project => {
            projectsHtml += `
            <div class="project-card" 
                 data-project-title="${project.title}" 
                 data-project-desc="${project.description}" 
                 data-project-img="${project.image}">
              <img src="${project.image}" alt="${project.title}" />
              <div class="project-info">
                <h3>${project.title}${project.status ? ` <span class="status-badge">${project.status}</span>` : ''}</h3>
                <p>${project.shortDescription}</p>
              </div>
            </div>`;
        });
        
        res.json({ 
            html: projectsHtml,
            count: projects.length
        });
    } catch (error) {
        console.error('Error generating HTML:', error);
        res.status(500).json({ message: 'Error generating HTML' });
    }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
