const express = require('express');
const passport = require('passport');
const Server = require('./models/Server');
const router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect('/auth/discord');
};

// Home route (serves frontend)
router.get('/', (req, res) => {
    res.sendFile('index.html', { root: './public' });
});

// Discord OAuth2 routes
router.get('/auth/discord', passport.authenticate('discord'));
router.get('/auth/discord/callback', passport.authenticate('discord', {
    failureRedirect: '/'
}), (req, res) => {
    res.redirect('/dashboard');
});

// Dashboard route
router.get('/dashboard', isAuthenticated, (req, res) => {
    res.sendFile('dashboard.html', { root: './public' });
});

// Settings route
router.get('/settings', isAuthenticated, (req, res) => {
    res.sendFile('settings.html', { root: './public' });
});

// API: Get user's servers
router.get('/api/servers', isAuthenticated, async (req, res) => {
    const guilds = req.user.guilds.filter(g => (g.permissions & 0x8) === 0x8); // Admin perms
    const serverData = await Server.find({ guildId: { $in: guilds.map(g => g.id) } });
    res.json(guilds.map(g => ({
        id: g.id,
        name: g.name,
        icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
        settings: serverData.find(s => s.guildId === g.id) || { prefix: '!', modules: { music: true } }
    })));
});

// API: Update server settings
router.post('/api/settings/:guildId', isAuthenticated, async (req, res) => {
    const { guildId } = req.params;
    const { prefix, music } = req.body;
    const server = await Server.findOneAndUpdate(
        { guildId },
        { prefix, modules: { music: music === 'true' } },
        { upsert: true, new: true }
    );
    res.json(server);
});

module.exports = router;
