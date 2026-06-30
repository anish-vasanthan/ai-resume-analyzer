const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      // Log server-side for debugging but never expose details to client
      if (jwtError.name === 'TokenExpiredError') {
        console.warn(`JWT expired for request to ${req.path}`);
        return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
      }
      console.warn(`JWT invalid (${jwtError.name}) for request to ${req.path}`);
      return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    const user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(`Auth middleware error: ${error.message}`);
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};
