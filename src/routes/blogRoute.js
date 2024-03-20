import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { fetchBlogs, fetchBlog, createBlog, updateBlog, deleteBlog, likeBlog, shareBlog } from '../controllers/blogController.js';
import auth from '../middleware/authentication.js';

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'blogImages',
        format: async (req, file) => 'png',
    },
});
const upload = multer({ storage });

const blogRoute = express.Router();

blogRoute.get('/', fetchBlogs);
blogRoute.get('/:id', fetchBlog);
blogRoute.post('/create', auth, upload.single('image'), createBlog);
blogRoute.put('/update/:id', auth, upload.single('image'), updateBlog);
blogRoute.delete('/delete/:id', auth, deleteBlog);
blogRoute.post('/like/:id', auth, likeBlog);
blogRoute.post('/share/:id', auth, shareBlog);

export default blogRoute;
