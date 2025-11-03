const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục uploads nếu chưa có
// Local: quiz-backend/public/uploads/images
// Production (cPanel): public_html/uploads/images (Apache serve trực tiếp)
const isProd = process.env.NODE_ENV === 'production';
const uploadDir = isProd 
  ? path.join(__dirname, '../../uploads/images')  // public_html/api/../uploads/images = public_html/uploads/images
  : path.join(__dirname, '../public/uploads/images');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình multer để lưu file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Tạo tên file unique: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    
    // Sanitize filename: loại bỏ ký tự đặc biệt, chỉ giữ chữ cái, số, dấu gạch ngang và gạch dưới
    const nameWithoutExt = path.basename(file.originalname, ext)
      .normalize('NFD') // Chuẩn hóa Unicode
      .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu thanh
      .replace(/[^a-zA-Z0-9-_]/g, '-') // Thay thế ký tự đặc biệt bằng dấu gạch ngang
      .replace(/-+/g, '-') // Gộp nhiều dấu gạch ngang thành 1
      .substring(0, 50); // Giới hạn độ dài tên file
    
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  }
});

// Giới hạn kích thước file 30MB và chỉ cho phép ảnh
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 30 * 1024 * 1024 // 30MB
  },
  fileFilter: (req, file, cb) => {
    // Chỉ chấp nhận file ảnh
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh!'), false);
    }
  }
});

/**
 * @route   POST /images/upload
 * @desc    Upload một ảnh và trả về URL
 * @access  Public (có thể thêm auth sau)
 */
router.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Không có file được tải lên' });
    }

    // Tạo URL để truy cập ảnh
    // Local: http://localhost:4000/uploads/images/filename.jpg
    // Production: https://yourdomain.com/uploads/images/filename.jpg (Apache serve)
    const protocol = req.protocol;
    const host = req.get('host');
    const imageUrl = `${protocol}://${host}/uploads/images/${req.file.filename}`;

    res.status(200).json({
      success: true,
      url: imageUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Lỗi khi upload ảnh' });
  }
});

/**
 * @route   DELETE /images/:filename
 * @desc    Xóa một ảnh (optional - để cleanup)
 * @access  Public (nên thêm auth)
 */
router.delete('/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    // Kiểm tra file có tồn tại không
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File không tồn tại' });
    }

    // Xóa file
    fs.unlinkSync(filePath);

    res.status(200).json({
      success: true,
      message: 'Đã xóa ảnh thành công'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Lỗi khi xóa ảnh' });
  }
});

module.exports = router;
