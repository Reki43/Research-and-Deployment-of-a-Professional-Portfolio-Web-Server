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

    // Auth routes
    app.get('/api/auth/google',
        passport.authenticate('google', { scope: ['profile', 'email'] })
    );

    app.get('/api/auth/google/callback',
        passport.authenticate('google', { failureRedirect: '/login.html' }),
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
};
