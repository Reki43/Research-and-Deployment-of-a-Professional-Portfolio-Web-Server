const express = require('express');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

const users = [
    {
        id: 1,
        email: 'henrywong228@hotmail.com',
        password: 'Henry2147'
    }
];

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    req.session.userId = user.id;
    res.json({ message: 'Logged in successfully' });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully' });
});

app.get('/api/check-session', (req, res) => {
    res.json({ isAuthenticated: !!req.session.userId });
});

app.listen(port, () => console.log('Auth server running'));
