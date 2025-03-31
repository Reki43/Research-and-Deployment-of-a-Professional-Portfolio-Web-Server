const express = require('express');
const session = require('express-session');
const cors = require('cors');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
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

// Passport Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
}, (accessToken, refreshToken, profile, done) => {
    // Check if user is allowed to access (using email)
    const adminEmail = process.env.ADMIN_EMAIL;
    const userEmail = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
    
    if (userEmail === adminEmail) {
        return done(null, {
            id: profile.id,
            email: userEmail,
            name: profile.displayName,
            isAdmin: true
        });
    }
    
    // Return non-admin user
    return done(null, {
        id: profile.id,
        email: userEmail,
        name: profile.displayName,
        isAdmin: false
    });
}));

// Serialize and deserialize user
passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// Legacy local auth (kept for backward compatibility)
const users = [
    {
        id: 1,
        email: 'henrywong228@hotmail.com',
        password: 'Henry2147'
    }
];

// Auth routes
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    req.session.userId = user.id;
    req.session.isAdmin = true;
    res.json({ message: 'Logged in successfully' });
});

// Google OAuth routes
app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        // Successful authentication
        req.session.isAuthenticated = true;
        res.redirect('/');
    }
);

app.post('/api/logout', (req, res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        req.session.destroy();
        res.json({ message: 'Logged out successfully' });
    });
});

app.get('/api/check-session', (req, res) => {
    res.json({ 
        isAuthenticated: req.isAuthenticated() || !!req.session.userId,
        user: req.user,
        isAdmin: req.user?.isAdmin || !!req.session.isAdmin
    });
});

// Projects API with protection
const projects = [
    // Initial projects data will be loaded from the frontend
];

// Get all projects
app.get('/api/projects', (req, res) => {
    res.json(projects);
});

// Protected route for updating projects
app.post('/api/projects', (req, res) => {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated() && !req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (!req.user?.isAdmin && !req.session.isAdmin) {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
    
    // Update projects
    const newProjects = req.body;
    projects.length = 0; // Clear array
    projects.push(...newProjects);
    
    res.json({ message: 'Projects updated successfully', projects });
});

app.listen(port, () => console.log(`Server running on port ${port}`));
