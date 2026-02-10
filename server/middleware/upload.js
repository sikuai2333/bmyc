const path = require('path');
const fs = require('fs');
const multer = require('multer');

const UPLOAD_DIR = path.join(__dirname, '..', 'data', 'uploads');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, UPLOAD_DIR),
    filename: (_, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();
      const safeExt = ['.pdf', '.jpg', '.jpeg', '.png'].includes(ext) ? ext : '';
      const name = `${Date.now()}-${Math.random().toString(16).slice(2)}${safeExt}`;
      cb(null, name);
    }
  }),
  fileFilter: (_, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (['.pdf', '.jpg', '.jpeg', '.png'].includes(ext)) {
      return cb(null, true);
    }
    return cb(new Error('仅支持 pdf/jpg/png 格式'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = {
  upload,
  UPLOAD_DIR
};
