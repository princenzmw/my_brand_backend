import express from 'express';
import multer from 'multer';
import path from 'path';
import { fetchBlogs, fetchBlog, createBlog, updateBlog, deleteBlog, likeBlog, shareBlog } from '../controllers/blogController.js';
import { auth } from '../middleware/userAuthMiddleware.js';

const blgroute = express.Router();

// Multer configurations
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './Media/blogs');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 10 // Limit to 10MB
    }
});

// Middleware to protect routes
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Only admins can perform this action.' });
    }
};

// Middleware to handle file validation errors
const handleFileUploadErrors = (error, req, res, next) => {
    if (req.fileValidationError) {
        res.status(400).json({ message: req.fileValidationError });
    } else if (error) {
        res.status(400).json({ message: error.message });
    } else {
        next();
    }
};

blgroute.get('/', fetchBlogs);
blgroute.get('/:id', fetchBlog);
blgroute.post('/create', auth, adminOnly, upload.single('image'), createBlog, handleFileUploadErrors);
blgroute.put('/update/:id', auth, adminOnly, upload.single('image'), updateBlog, handleFileUploadErrors);
blgroute.delete('/delete/:id', auth, adminOnly, deleteBlog);
blgroute.post('/like/:id', auth, likeBlog);
blgroute.post('/share/:id', auth, shareBlog);

export default blgroute;
