import express from 'express';
import multer from 'multer';
import path from 'path'

import { fetchBlogs, createBlog, updateBlog, deleteBlog } from '../controllers/blogController.js';

const blgroute = express.Router();

// Multer configurations
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './Media/blogs')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10  // Limit to 10MB
    }
});

blgroute.post('/create', upload.single('image'), createBlog);
blgroute.get('/getAllBlogs', fetchBlogs);
blgroute.put('/update/:id', upload.single('image'), updateBlog);
blgroute.delete('/delete/:id', deleteBlog);

export default blgroute;
