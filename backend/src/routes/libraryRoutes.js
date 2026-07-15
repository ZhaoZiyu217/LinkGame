const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const auth = require('../middleware/auth');
const { successResponse, errorResponse } = require('../utils/response');

const router = express.Router();

console.log('✅ libraryRoutes 加载成功');

// ===== 确保上传目录存在 =====
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ===== 配置 multer =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('仅支持 JPG/PNG 格式'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ===== 测试接口 =====
router.get('/test', (req, res) => {
  res.json({ code: 200, message: 'library 路由正常' });
});

// ===== 获取图库列表 =====
router.get('/list', auth, async (req, res) => {
  try {
    const hospitalId = req.user.hospital_id;
    const { stage, page = 1, size = 20 } = req.query;
    const offset = (page - 1) * size;

    let sql = 'SELECT * FROM pressure_sore_library WHERE hospital_id = ?';
    const params = [hospitalId];

    if (stage) {
      sql += ' AND stage = ?';
      params.push(stage);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(size), parseInt(offset));

    const [list] = await db.query(sql, params);

    const [total] = await db.query(
      'SELECT COUNT(*) as count FROM pressure_sore_library WHERE hospital_id = ?' + (stage ? ' AND stage = ?' : ''),
      stage ? [hospitalId, stage] : [hospitalId]
    );

    res.json(successResponse({
      list,
      total: total[0]?.count || 0,
      page: parseInt(page),
      size: parseInt(size)
    }));
  } catch (error) {
    console.error('获取列表错误:', error);
    res.status(500).json(errorResponse('获取列表失败'));
  }
});

// ===== 上传图片 =====
router.post('/upload', auth, upload.single('image'), async (req, res) => {
  try {
    console.log('📸 收到上传请求');
    
    if (req.user.role !== 'admin') {
      return res.status(403).json(errorResponse('仅管理员可上传'));
    }

    if (!req.file) {
      return res.status(400).json(errorResponse('请上传图片文件'));
    }

    console.log('📁 文件信息:', req.file);

    const { name, description, stage } = req.body;
    const imageUrl = `/uploads/${req.file.filename}`;
    const hospitalId = req.user.hospital_id;

    const [result] = await db.query(
      `INSERT INTO pressure_sore_library 
       (name, description, image_url, stage, hospital_id, uploaded_by) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name || '未命名', description || '', imageUrl, stage || '', hospitalId, req.user.id]
    );

    console.log('✅ 上传成功，ID:', result.insertId);

    res.json(successResponse({
      id: result.insertId,
      imageUrl
    }, '上传成功'));
  } catch (error) {
    console.error('❌ 上传错误:', error);
    res.status(500).json(errorResponse('上传失败：' + error.message));
  }
});

// ===== 删除图片 =====
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json(errorResponse('仅管理员可删除'));
    }

    const id = req.params.id;
    const hospitalId = req.user.hospital_id;

    const [images] = await db.query(
      'SELECT image_url FROM pressure_sore_library WHERE id = ? AND hospital_id = ?',
      [id, hospitalId]
    );

    if (images.length === 0) {
      return res.status(404).json(errorResponse('图片不存在'));
    }

    const filePath = path.join(__dirname, '../../', images[0].image_url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await db.query(
      'DELETE FROM pressure_sore_library WHERE id = ? AND hospital_id = ?',
      [id, hospitalId]
    );

    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    console.error('删除错误:', error);
    res.status(500).json(errorResponse('删除失败'));
  }
});

module.exports = router;