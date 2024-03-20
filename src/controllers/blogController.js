import Blog from '../models/blogModel.js';
import cloudinary from 'cloudinary';
import { isAdmin } from '../middleware/authentication.js';

export const fetchBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id).populate('author', 'username');
        if (!blog) {
            return res.status(404).json({ message: 'No blog found.' });
        }
        res.status(200).json(blog);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

export const fetchBlogs = async (req, res) => {
    try {
        const PAGE_SIZE = 5; // Number of blogs per page
        const page = parseInt(req.query.page || "0");
        const total = await Blog.countDocuments({});

        const blogs = await Blog.find()
            .limit(PAGE_SIZE)
            .skip(PAGE_SIZE * page)
            .populate('author', 'username');

        if (!blogs.length) {
            return res.status(404).json({ message: 'No blogs found.' });
        }

        res.status(200).json({ totalPages: Math.ceil(total / PAGE_SIZE), blogs });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

export const createBlog = async (req, res) => {
    try {
        const { title, content } = req.body;
        const author = req.user.userId;

        if (!title || title.length < 5 || !content || content.length < 15) {
            return res.status(400).json({ message: 'Please provide a title with at least 5 characters and content with at least 15 characters.' });
        }

        let image;
        if (req.file) image = req.file.filename;

        const newBlog = new Blog({ title, image, content, author });

        const savedBlog = await newBlog.save();

        res.status(201).json({ message: 'Blog added successfully!', blog: savedBlog });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Invalid blog data', error: error.message });
        }
        res.status(500).json({ message: 'An error occurred while adding the blog', error: error.message });
    }
}

export const updateBlog = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;
    const { title, content } = req.body;
    const newImage = req.file ? req.file.filename : null;

    if (!(await isAdmin(userId))) {
        return res.status(403).json({ message: 'Access denied. Only admins can update blogs.' });
    }

    try {
        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found.' });
        }

        if (newImage && blog.image) {
            let result = await cloudinary.uploader.destroy(blog.image); // Delete old image
            if (result.error) {
                return res.status(500).json({ message: 'Failed to delete old image.' });
            }
        }

        const updatedData = {
            title: title || blog.title,
            content: content || blog.content,
            image: newImage ? newImage : blog.image
        };

        const updatedBlog = await Blog.findByIdAndUpdate(id, updatedData, { new: true, runValidators: true });
        res.status(200).json({ message: "Blog updated successfully", blog: updatedBlog });

    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

export const deleteBlog = async (req, res) => {
    if (!await isAdmin(req.user.userId)) {
        return res.status(403).json({ message: 'Access denied. Only admins can delete blogs.' });
    }

    try {
        const id = req.params.id;
        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found.' });
        }

        let result = await cloudinary.uploader.destroy(blog.image); // Corrected
        if (result.error) {
            return res.status(500).json({ message: 'Failed to delete image from cloud.', error: result.error });
        }

        await Blog.findByIdAndDelete(id);
        res.status(200).json({ message: 'Blog deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

export const likeBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'No blog found.' });
        }

        // If user already liked the blog, remove his like
        if (blog.likedBy.includes(req.user.userId)) {
            const index = blog.likedBy.indexOf(req.user.userId);
            blog.likedBy.splice(index, 1);
            await blog.save();
            return res.status(200).json({ message: 'Disliked the blog.', blog });
        }

        // Else add user to likedBy
        blog.likedBy.push(req.user.userId);
        await blog.save();
        res.status(200).json({ message: 'Liked the blog!', blog });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

export const shareBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'No blog found.' });
        }

        // Add user to sharedBy
        blog.sharedBy.push(req.user.userId);
        await blog.save();
        res.status(200).json({ message: 'Shared the blog!', blog });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}
