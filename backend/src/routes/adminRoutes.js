const express = require('express');
const db = require('../config/database');
const auth = require('../middleware/auth');
const { successResponse, errorResponse } = require('../utils/response');

const router = express.Router();

// 所有接口需要登录
router.use(auth);

// ===== 获取数据概览 =====
router.get('/overview', async (req, res) => {
  try {
    const hospitalId = req.user.hospital_id || 1;

    const [users] = await db.query(
      'SELECT COUNT(*) as count FROM user WHERE hospital_id = ? AND role = "user"',
      [hospitalId]
    );

    const [exams] = await db.query(
      `SELECT COUNT(*) as count 
       FROM user_record r
       JOIN user u ON r.user_id = u.id
       WHERE u.hospital_id = ? AND r.type = 'exam'`,
      [hospitalId]
    );

    const [avgScore] = await db.query(
      `SELECT ROUND(AVG(r.score), 0) as avg_score 
       FROM user_record r
       JOIN user u ON r.user_id = u.id
       WHERE u.hospital_id = ? AND r.type = 'exam'`,
      [hospitalId]
    );

    const [images] = await db.query(
      'SELECT COUNT(*) as count FROM pressure_sore_library WHERE hospital_id = ?',
      [hospitalId]
    );

    const [recent] = await db.query(
      `SELECT 
        u.username,
        u.real_name,
        r.score,
        r.duration,
        r.wrong_count,
        DATE_FORMAT(r.created_at, '%Y-%m-%d %H:%i') as created_at
       FROM user_record r
       JOIN user u ON r.user_id = u.id
       WHERE u.hospital_id = ? AND r.type = 'exam'
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [hospitalId]
    );

    res.json(successResponse({
      totalUsers: users[0]?.count || 0,
      totalExams: exams[0]?.count || 0,
      avgScore: avgScore[0]?.avg_score || 0,
      totalImages: images[0]?.count || 0,
      recentRecords: recent || []
    }));
  } catch (error) {
    console.error('获取概览错误:', error);
    res.status(500).json(errorResponse('获取概览失败'));
  }
});

// ===== 获取本院员工汇总信息 =====
router.get('/records', async (req, res) => {
  try {
    const hospitalId = req.user.hospital_id || 1;
    const { page = 1, size = 20 } = req.query;
    const offset = (page - 1) * size;

    const [list] = await db.query(
      `SELECT 
        u.id,
        u.username,
        u.real_name,
        u.score as total_score,
        COUNT(r.id) as exam_count,
        ROUND(AVG(r.score), 0) as avg_score,
        MAX(r.score) as max_score,
        RANK() OVER (ORDER BY AVG(r.score) DESC) as rank_num
       FROM user u
       LEFT JOIN user_record r ON u.id = r.user_id AND r.type = 'exam'
       WHERE u.hospital_id = ? AND u.role = 'user'
       GROUP BY u.id
       ORDER BY avg_score DESC, total_score DESC
       LIMIT ? OFFSET ?`,
      [hospitalId, parseInt(size), parseInt(offset)]
    );

    const [total] = await db.query(
      'SELECT COUNT(*) as count FROM user WHERE hospital_id = ? AND role = "user"',
      [hospitalId]
    );

    res.json(successResponse({
      list: list || [],
      total: total[0]?.count || 0,
      page: parseInt(page),
      size: parseInt(size)
    }));
  } catch (error) {
    console.error('获取员工信息错误:', error);
    res.status(500).json(errorResponse('获取员工信息失败'));
  }
});

// ===== 导出员工数据 =====
router.get('/export', async (req, res) => {
  try {
    const hospitalId = req.user.hospital_id || 1;

    const [list] = await db.query(
      `SELECT 
        u.username,
        u.real_name,
        u.score as total_score,
        COUNT(r.id) as exam_count,
        ROUND(AVG(r.score), 0) as avg_score,
        MAX(r.score) as max_score,
        RANK() OVER (ORDER BY AVG(r.score) DESC) as rank_num
       FROM user u
       LEFT JOIN user_record r ON u.id = r.user_id AND r.type = 'exam'
       WHERE u.hospital_id = ? AND u.role = 'user'
       GROUP BY u.id
       ORDER BY avg_score DESC, total_score DESC`,
      [hospitalId]
    );

    let csv = '排名,用户名,姓名,考试次数,总积分,平均分,最高分\n';
    list.forEach((row, index) => {
      const rank = row.rank_num || (index + 1);
      csv += `${rank},${row.username},${row.real_name || ''},${row.exam_count || 0},${row.total_score || 0},${row.avg_score || 0},${row.max_score || 0}\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="员工数据_${new Date().toISOString().slice(0,10)}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('导出数据错误:', error);
    res.status(500).json(errorResponse('导出数据失败'));
  }
});

// ===== 获取医院信息 =====
router.get('/hospital', async (req, res) => {
  try {
    const hospitalId = req.user.hospital_id || 1;

    const [result] = await db.query(
      'SELECT id, name, code, address, contact_phone FROM hospital WHERE id = ?',
      [hospitalId]
    );

    if (result.length === 0) {
      return res.status(404).json(errorResponse('医院不存在'));
    }

    res.json(successResponse(result[0]));
  } catch (error) {
    console.error('获取医院信息错误:', error);
    res.status(500).json(errorResponse('获取医院信息失败'));
  }
});

// ===== 更新医院信息 =====
router.put('/hospital', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json(errorResponse('仅管理员可操作'));
    }

    const hospitalId = req.user.hospital_id || 1;
    const { name, code, address, contact_phone } = req.body;

    if (!name || !code) {
      return res.status(400).json(errorResponse('医院名称和编码不能为空'));
    }

    await db.query(
      `UPDATE hospital 
       SET name = ?, code = ?, address = ?, contact_phone = ? 
       WHERE id = ?`,
      [name, code, address || '', contact_phone || '', hospitalId]
    );

    res.json(successResponse(null, '医院信息更新成功'));
  } catch (error) {
    console.error('更新医院信息错误:', error);
    res.status(500).json(errorResponse('更新医院信息失败'));
  }
});

// ===== 验证管理员密码 =====
router.post('/verify-password', auth, async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    // 获取当前用户的密码
    const [users] = await db.query(
      'SELECT password FROM user WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json(errorResponse('用户不存在'));
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, users[0].password);
    if (isValid) {
      res.json(successResponse({ valid: true }, '验证通过'));
    } else {
      res.status(401).json(errorResponse('密码错误', 401));
    }
  } catch (error) {
    console.error('验证密码错误:', error);
    res.status(500).json(errorResponse('验证失败'));
  }
});

module.exports = router;