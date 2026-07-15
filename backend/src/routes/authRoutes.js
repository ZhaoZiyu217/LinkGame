const express = require('express');
const { register, login, getCurrentUser } = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// 公开接口
router.post('/register', register);
router.post('/login', login);

// 需要登录的接口
router.get('/me', auth, getCurrentUser);

module.exports = router;