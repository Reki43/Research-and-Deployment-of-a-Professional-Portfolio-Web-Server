const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

module.exports = (app) => {
    // Google OAuth Strategy
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL
    }, (accessToken, refreshToken, profile, done) => {
        // Grant admin rights to all authenticated users
        const userEmail = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
        
        // All authenticated users are now admins
        return done(null, {
            id: profile.id,
            email: userEmail,
            name: profile.displayName,
            isAdmin: true  // Make all users admins
        });
    }));

    // Serialize and deserialize user
    passport.serializeUser((user, done) => {
        done(null, user);
    });

    passport.deserializeUser((user, done) => {
        done(null, user);
    });

    // Auth routes
    app.get('/api/auth/google',
        passport.authenticate('google', { scope: ['profile', 'email'] })
    );

    app.get('/api/auth/google/callback',
        passport.authenticate('google', { failureRedirect: '/login.html' }),
        (req, res) => {
            // Successful authentication
            req.session.isAuthenticated = true;
            
            // Debug information
            console.log('Google auth successful for:', req.user?.email);
            console.log('Is admin? (All users are now admins):', true);
            
            // Set admin flag for all authenticated users
            req.session.isAdmin = true;
            
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
        // Debug information
        console.log('Session check requested');
        console.log('- Auth status:', req.isAuthenticated() || !!req.session.userId || !!req.session.isAuthenticated);
        
        // All authenticated users are considered admins
        const isAuthenticated = req.isAuthenticated() || !!req.session.userId || !!req.session.isAuthenticated;
        const isAdmin = isAuthenticated;  // If authenticated, then admin
        
        console.log('- Admin status:', isAdmin);
        console.log('- User:', req.user);
        console.log('- Session:', req.session);
        
        res.json({ 
            isAuthenticated: isAuthenticated,
            user: req.user,
            isAdmin: isAdmin
        });
    });
};
