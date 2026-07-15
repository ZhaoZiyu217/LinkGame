const express = require('express');
const db = require('../config/database');
const auth = require('../middleware/auth');
const { successResponse, errorResponse } = require('../utils/response');

const router = express.Router();

// ===== 保存考试记录 =====
router.post('/exam', auth, async (req, res) => {
  try {
    const { examScore, duration, wrongCount, wrongQuestions } = req.body;
    const userId = req.user.id;
    const hospitalId = req.user.hospital_id || 1;

    console.log('📝 保存考试记录:', { userId, examScore, duration, wrongCount });

    const [result] = await db.query(
      `INSERT INTO user_record 
       (user_id, type, score, duration, wrong_count, wrong_questions) 
       VALUES (?, 'exam', ?, ?, ?, ?)`,
      [userId, examScore || 0, duration || 0, wrongCount || 0, JSON.stringify(wrongQuestions || [])]
    );

    console.log('✅ 考试记录已保存，ID:', result.insertId);

    const bonusScore = (examScore || 0) * 2;
    await db.query(
      'UPDATE user SET score = score + ? WHERE id = ?',
      [bonusScore, userId]
    );
    console.log('✅ 用户积分已更新，增加:', bonusScore);

    if (wrongQuestions && wrongQuestions.length > 0) {
      for (const wrong of wrongQuestions) {
        const [existing] = await db.query(
          'SELECT id FROM user_mistakes WHERE user_id = ? AND stage_key = ? AND value = ?',
          [userId, wrong.stageKey, wrong.value]
        );

        if (existing.length === 0) {
          await db.query(
            `INSERT INTO user_mistakes 
             (user_id, hospital_id, stage_key, value, count, last_time) 
             VALUES (?, ?, ?, ?, 1, NOW())`,
            [userId, hospitalId, wrong.stageKey, wrong.value]
          );
        }
      }
    }

    res.json(successResponse({ 
      recordId: result.insertId,
      bonusScore: bonusScore
    }, '考试记录保存成功'));
  } catch (error) {
    console.error('❌ 保存考试记录错误:', error);
    res.status(500).json(errorResponse('保存考试记录失败：' + error.message));
  }
});

// ===== 保存练习积分 =====
router.post('/practice', auth, async (req, res) => {
  try {
    const { duration, pairs } = req.body;
    const userId = req.user.id;

    console.log('📝 保存练习积分:', { userId, duration, pairs });

    const bonusScore = 5;
    await db.query(
      'UPDATE user SET score = score + ? WHERE id = ?',
      [bonusScore, userId]
    );

    await db.query(
      `INSERT INTO user_record 
       (user_id, type, score, duration) 
       VALUES (?, 'practice', ?, ?)`,
      [userId, bonusScore, duration || 0]
    );

    console.log('✅ 练习积分已保存，+5分');
    res.json(successResponse({ bonusScore: 5 }, '练习积分保存成功'));
  } catch (error) {
    console.error('❌ 保存练习积分错误:', error);
    res.status(500).json(errorResponse('保存练习积分失败'));
  }
});

// ===== 获取学习记录列表 =====
router.get('/list', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, size = 10 } = req.query;
    const offset = (page - 1) * size;

    const [list] = await db.query(
      `SELECT id, type, score, duration, wrong_count, 
              DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as created_at
       FROM user_record 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, parseInt(size), parseInt(offset)]
    );

    const [total] = await db.query(
      'SELECT COUNT(*) as count FROM user_record WHERE user_id = ?',
      [userId]
    );

    res.json(successResponse({
      list,
      total: total[0].count,
      page: parseInt(page),
      size: parseInt(size)
    }));
  } catch (error) {
    console.error('❌ 获取学习记录错误:', error);
    res.status(500).json(errorResponse('获取学习记录失败'));
  }
});

// ===== 获取学习统计 =====
router.get('/statistics', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await db.query(
      `SELECT 
        COUNT(*) as totalExams,
        ROUND(AVG(score), 0) as avgScore,
        MAX(score) as maxScore,
        MIN(score) as minScore
       FROM user_record 
       WHERE user_id = ? AND type = 'exam'`,
      [userId]
    );

    res.json(successResponse({
      totalExams: result[0]?.totalExams || 0,
      avgScore: result[0]?.avgScore || 0,
      maxScore: result[0]?.maxScore || 0,
      minScore: result[0]?.minScore || 0
    }));
  } catch (error) {
    console.error('❌ 获取学习统计错误:', error);
    res.status(500).json(errorResponse('获取学习统计失败'));
  }
});

// ===== 获取排行榜 =====
router.get('/ranking', auth, async (req, res) => {
  try {
    const hospitalId = req.user.hospital_id || 1;

    const [list] = await db.query(
      `SELECT 
        u.id,
        u.username,
        u.real_name,
        ROUND(AVG(r.score), 0) as avg_score,
        COUNT(r.id) as exam_count,
        MAX(r.score) as max_score,
        (SELECT score FROM user WHERE id = u.id) as total_score
       FROM user u
       INNER JOIN user_record r ON u.id = r.user_id AND r.type = 'exam'
       WHERE u.hospital_id = ? AND u.role = 'user'
       GROUP BY u.id
       HAVING exam_count > 0
       ORDER BY avg_score DESC
       LIMIT 20`,
      [hospitalId]
    );

    res.json(successResponse(list));
  } catch (error) {
    console.error('❌ 获取排行榜错误:', error);
    res.status(500).json(errorResponse('获取排行榜失败'));
  }
});

module.exports = router;