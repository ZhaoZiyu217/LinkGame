const express = require('express');
const db = require('../config/database');
const auth = require('../middleware/auth');
const { successResponse, errorResponse } = require('../utils/response');

const router = express.Router();

// ===== 保存错题 =====
router.post('/save', auth, async (req, res) => {
  try {
    console.log('📝 收到保存错题请求:', req.body);
    const { wrongRecords } = req.body;
    const userId = req.user.id;
    const hospitalId = req.user.hospital_id || 1;

    if (!wrongRecords || wrongRecords.length === 0) {
      return res.json(successResponse({ saved: 0 }, '没有错题可保存'));
    }

    let savedCount = 0;

    for (const record of wrongRecords) {
      try {
        const imageUrl = record.imageUrl || '/images/placeholder.jpg';
        const imageName = record.imageName || '未知图片';

        console.log('📝 处理错题:', { userId, hospitalId, stageKey: record.stageKey, imageUrl });

        // 检查是否已存在
        const [existing] = await db.query(
          'SELECT id FROM user_mistakes WHERE user_id = ? AND image_url = ?',
          [userId, imageUrl]
        );

        if (existing.length > 0) {
          await db.query(
            'UPDATE user_mistakes SET count = count + 1, last_time = NOW() WHERE id = ?',
            [existing[0].id]
          );
          console.log('✅ 更新已有错题');
        } else {
         await db.query(
  `INSERT INTO user_mistakes 
   (user_id, hospital_id, stage_key, image_url, image_name, value, count, last_time) 
   VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`,
  [userId, hospitalId, record.stageKey, imageUrl, imageName, 0]
);
          console.log('✅ 插入新错题');
        }
        savedCount++;
      } catch (err) {
        console.error('❌ 单条错题保存失败:', err.message);
      }
    }

    console.log('✅ 错题保存完成，共保存', savedCount, '条');
    res.json(successResponse({ saved: savedCount }, `成功保存 ${savedCount} 条错题`));
  } catch (error) {
    console.error('❌ 保存错题错误:', error);
    res.status(500).json(errorResponse('保存错题失败：' + error.message));
  }
});

// ===== 获取错题列表 =====
router.get('/list', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📋 获取用户错题列表:', userId);

    const [list] = await db.query(
      `SELECT 
        m.id,
        m.stage_key,
        m.image_url,
        m.image_name,
        m.count,
        DATE_FORMAT(m.last_time, '%Y-%m-%d %H:%i') as last_time
       FROM user_mistakes m
       WHERE m.user_id = ?
       ORDER BY m.last_time DESC`,
      [userId]
    );

    console.log('📋 查询到', list.length, '条错题');
    res.json(successResponse(list));
  } catch (error) {
    console.error('❌ 获取错题列表错误:', error);
    res.status(500).json(errorResponse('获取错题列表失败'));
  }
});

// ===== 删除错题 =====
router.delete('/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;

    const [result] = await db.query(
      'DELETE FROM user_mistakes WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse('错题不存在或无权限删除'));
    }

    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    console.error('❌ 删除错题错误:', error);
    res.status(500).json(errorResponse('删除失败'));
  }
});

// ===== 获取错题统计 =====
router.get('/statistics', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [total] = await db.query(
      'SELECT COUNT(*) as total FROM user_mistakes WHERE user_id = ?',
      [userId]
    );

    const [stages] = await db.query(
      `SELECT stage_key, COUNT(*) as count, SUM(count) as total_count 
       FROM user_mistakes 
       WHERE user_id = ? 
       GROUP BY stage_key`,
      [userId]
    );

    res.json(successResponse({
      total: total[0].total,
      stages: stages
    }));
  } catch (error) {
    console.error('❌ 获取错题统计错误:', error);
    res.status(500).json(errorResponse('获取统计失败'));
  }
});

module.exports = router;