const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Every API call needs the signed-in user; reading it from Atlas each time added
// a database round trip to every request. Users are kept briefly in memory and
// dropped as soon as their record is written (role change, deactivation, delete).
const USER_CACHE_TTL_MS = 30 * 1000;
const userCache = new Map(); // id -> { user, at }
// Bumped on every user write, so a read that overlapped a write is not cached.
let userWrites = 0;
User.listEvents.on('change', (id) => { userWrites += 1; userCache.delete(id); });
User.listEvents.on('bulkChange', () => { userWrites += 1; userCache.clear(); });

const findUser = async (id) => {
    const key = String(id);
    const cached = userCache.get(key);
    if (cached && Date.now() - cached.at < USER_CACHE_TTL_MS) return cached.user;
    const writesBefore = userWrites;
    const user = await User.findById(id);
    if (user && writesBefore === userWrites) {
        userCache.set(key, { user, at: Date.now() });
        if (userCache.size > 1000) userCache.delete(userCache.keys().next().value);
    } else {
        userCache.delete(key);
    }
    return user;
};

const protect = async (req, res, next) => {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: "Not authorized, no token" });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch the full user object and attach to request
        req.user = await findUser(decoded.id);
        
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Not authorized, user not found" });
        }
        
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: "Not authorized, token failed" });
    }
};

const optionalAuth = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await findUser(decoded.id);
    } catch (error) {
        // Token invalid or expired, continue without req.user
    }

    next();
};

module.exports = {
  protect,
  optionalAuth,
};