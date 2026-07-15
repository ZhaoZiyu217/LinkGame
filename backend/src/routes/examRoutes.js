const express = require('express');
const db = require('../config/database');
const auth = require('../middleware/auth');
const { successResponse, errorResponse } = require('../utils/response');

const router = express.Router();

// 所有接口需要登录
router.use(auth);

// ===== 管理员：创建考试 =====
router.post('/create', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json(errorResponse('仅管理员可操作'));
    }

    const hospitalId = req.user.hospital_id || 1;
    const { title, difficulty, start_time, end_time, duration } = req.body;

    if (!title || !start_time || !end_time) {
      return res.status(400).json(errorResponse('请填写完整信息'));
    }

    await db.query(
      `INSERT INTO exam 
       (hospital_id, title, difficulty, start_time, end_time, duration, status, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, 'published', ?)`,
      [hospitalId, title, difficulty || 'hard', start_time, end_time, duration || 300, req.user.id]
    );

    res.json(successResponse(null, '考试发布成功'));
  } catch (error) {
    console.error('创建考试错误:', error);
    res.status(500).json(errorResponse('创建考试失败'));
  }
});

// ===== 管理员：获取考试列表 =====
router.get('/list', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json(errorResponse('仅管理员可操作'));
    }

    const hospitalId = req.user.hospital_id || 1;

    const [list] = await db.query(
      `SELECT id, title, difficulty, start_time, end_time, duration, status,
              DATE_FORMAT(start_time, '%Y-%m-%d %H:%i') as start_time_str,
              DATE_FORMAT(end_time, '%Y-%m-%d %H:%i') as end_time_str
       FROM exam 
       WHERE hospital_id = ? 
       ORDER BY created_at DESC`,
      [hospitalId]
    );

    res.json(successResponse(list));
  } catch (error) {
    console.error('获取考试列表错误:', error);
    res.status(500).json(errorResponse('获取考试列表失败'));
  }
});

// ===== 管理员：结束考试 =====
router.put('/:id/end', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json(errorResponse('仅管理员可操作'));
    }

    const id = req.params.id;
    const hospitalId = req.user.hospital_id || 1;

    await db.query(
      'UPDATE exam SET status = "ended" WHERE id = ? AND hospital_id = ?',
      [id, hospitalId]
    );

    res.json(successResponse(null, '考试已结束'));
  } catch (error) {
    console.error('结束考试错误:', error);
    res.status(500).json(errorResponse('结束考试失败'));
  }
});

// ===== 用户：获取当前有效考试 =====
router.get('/current', async (req, res) => {
  try {
    const hospitalId = req.user.hospital_id || 1;

    const [list] = await db.query(
      `SELECT id, title, difficulty, start_time, end_time, duration,
              DATE_FORMAT(start_time, '%Y-%m-%d %H:%i') as start_time_str,
              DATE_FORMAT(end_time, '%Y-%m-%d %H:%i') as end_time_str
       FROM exam 
       WHERE hospital_id = ? AND status = 'published'
       ORDER BY start_time DESC
       LIMIT 1`,
      [hospitalId]
    );

    if (list.length === 0) {
      return res.json(successResponse(null, '暂无考试'));
    }

    res.json(successResponse(list[0]));
  } catch (error) {
    console.error('获取当前考试错误:', error);
    res.status(500).json(errorResponse('获取考试失败'));
  }
});

module.exports = router;