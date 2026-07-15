const jwt = require('jsonwebtoken');
const { secret } = require('../config/jwt');
const { errorResponse } = require('../utils/response');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(errorResponse('未登录，请先登录', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(errorResponse('登录已过期，请重新登录', 401));
    }
    return res.status(401).json(errorResponse('无效的登录凭证', 401));
  }
};