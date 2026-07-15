const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { secret, expiresIn } = require('../config/jwt');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * 用户注册
 */
const register = async (req, res) => {
  try {
    const { username, password, realName, hospitalCode } = req.body;

    // 1. 检查必填字段
    if (!username || !password || !realName || !hospitalCode) {
      return res.status(400).json(errorResponse('请填写完整信息'));
    }

    // 2. 检查医院是否存在
    const [hospitals] = await db.query(
      'SELECT id FROM hospital WHERE code = ?',
      [hospitalCode]
    );
    if (hospitals.length === 0) {
      return res.status(400).json(errorResponse('医院编码不存在，请联系管理员'));
    }
    const hospitalId = hospitals[0].id;

    // 3. 检查用户名是否已存在
    const [users] = await db.query(
      'SELECT id FROM user WHERE username = ?',
      [username]
    );
    if (users.length > 0) {
      return res.status(400).json(errorResponse('用户名已存在'));
    }

    // 4. 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. 创建用户
    const [result] = await db.query(
      `INSERT INTO user (username, password, real_name, hospital_id, role) 
       VALUES (?, ?, ?, ?, 'user')`,
      [username, hashedPassword, realName, hospitalId]
    );

    res.json(successResponse({ id: result.insertId }, '注册成功'));
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json(errorResponse('注册失败，请稍后重试'));
  }
};

/**
 * 用户登录
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. 检查必填字段
    if (!username || !password) {
      return res.status(400).json(errorResponse('请输入用户名和密码'));
    }

    // 2. 查询用户（关联医院信息）
    const [users] = await db.query(
      `SELECT u.*, h.name as hospital_name, h.code as hospital_code 
       FROM user u 
       JOIN hospital h ON u.hospital_id = h.id 
       WHERE u.username = ?`,
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json(errorResponse('用户名或密码错误', 401));
    }

    const user = users[0];

    // 3. 验证密码
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json(errorResponse('用户名或密码错误', 401));
    }

    // 4. 生成 JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role, 
        hospital_id: user.hospital_id 
      },
      secret,
      { expiresIn }
    );

    // 5. 返回用户信息（排除密码）
    const { password: _, ...userInfo } = user;

    res.json(successResponse({
      token,
      user: userInfo
    }, '登录成功'));
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json(errorResponse('登录失败，请稍后重试'));
  }
};

/**
 * 获取当前用户信息
 */
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await db.query(
      `SELECT u.*, h.name as hospital_name, h.code as hospital_code 
       FROM user u 
       JOIN hospital h ON u.hospital_id = h.id 
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json(errorResponse('用户不存在'));
    }

    const { password, ...userInfo } = users[0];
    res.json(successResponse(userInfo));
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json(errorResponse('获取用户信息失败'));
  }
};

module.exports = {
  register,
  login,
  getCurrentUser
};