const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== 路由 =====
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/mistakes', require('./src/routes/mistakeRoutes'));
app.use('/api/records', require('./src/routes/recordRoutes'));
app.use('/api/library', require('./src/routes/libraryRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/exam', require('./src/routes/examRoutes'));

// ===== 测试接口 =====
app.get('/api/test', (req, res) => {
  res.json({ code: 200, message: '后端服务运行正常！' });
});

app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ code: 500, message: err.message || '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`🚀 后端服务已启动: http://localhost:${PORT}`);
  console.log(`📡 测试接口: http://localhost:${PORT}/api/test`);
});