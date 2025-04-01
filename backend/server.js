const express = require('express');
const session = require('express-session');
const cors = require('cors');
const passport = require('passport');
require('dotenv').config({ path: '../.env' }); // Specify the correct path to the .env file

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: true,
    credentials: true
}));

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

// Projects API with protection
const projects = [
    // Initial projects data will be loaded from the frontend
];

// Get all projects
app.get('/api/projects', (req, res) => {
    res.json(projects);
});

// Protected route for updating projects - only requires authentication
app.post('/api/projects', requireAuth, (req, res) => {
    // Update projects
    const newProjects = req.body;
    projects.length = 0; // Clear array
    projects.push(...newProjects);
    
    res.json({ message: 'Projects updated successfully', projects });
});

app.listen(port, () => console.log(`Server running on port ${port}`));
