import Blog from '../models/blogModel.js';
import fs from 'fs';

export const createBlog = async (req, res) => {
    try {
        const { title, description } = req.body;
        const image = req.file ? req.file.path : "default/path";

        const newBlog = new Blog({
            title,
            image,
            description
        });

        await newBlog.save(); // Save the new blog to the database

        res.status(201).send('Blog added successfully!');
    } catch (error) {
        res.status(500).send({ message: 'An error occurred while adding the blog', error: error.message });
    }
}

export const fetchBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find();
        if (blogs.length === 0) {
            return res.status(404).json({ message: 'No blogs found.' });
        }

        // Check each blog for an existing image file
        const blogsProcessed = await Promise.all(blogs.map(async (blog) => {
            if (blog.image && !fs.existsSync(blog.image)) {
                // Image file does not exist, set to default path
                blog.image = "default/path";
                await Blog.findByIdAndUpdate(blog._id, { image: "default/path" });
            }
            return blog;
        }));

        res.status(200).json(blogsProcessed);
    } catch (err) {
        res.status(500).json({ message: "Internal Server Error: ", error: err.message });
    }
}

export const updateBlog = async (req, res) => {
    try {
        const id = req.params.id;
        const { title, description } = req.body;
        const newImage = req.file ? req.file.path : null;

        const blogExists = await Blog.findById(id);
        if (!blogExists) {
            return res.status(404).json({ message: 'Blog not found.' });
        }

        if (newImage && blogExists.image && fs.existsSync(blogExists.image) && blogExists.image !== "default/path") {
            // Delete the existing image file safely
            try {
                await fs.promises.unlink(blogExists.image);
            } catch (error) {
                return res.status(500).json({ message: `Could not delete old image file: ${error.message}` });
            }
        }

        const updatedData = {
            title: title || blogExists.title,
            description: description || blogExists.description,
            image: newImage || blogExists.image
        };

        const updatedBlog = await Blog.findByIdAndUpdate(id, updatedData, { new: true, runValidators: true });
        res.status(200).json({ message: "Blog Updated successfully", blog: updatedBlog });

    } catch (error) {
        res.status(500).json({ message: "Internal Server Error: ", error: error.message });
    }
}


export const deleteBlog = async (req, res) => {
    try {
        const id = req.params.id;
        const blogExists = await Blog.findById(id);
        if (!blogExists) {
            return res.status(404).json({ message: 'Blog not found.' });
        }

        const deleteImageFile = async () => {
            if (fs.existsSync(blogExists.image)) {
                await fs.promises.unlink(blogExists.image);
            }
        };

        await deleteImageFile();

        await Blog.findByIdAndDelete(id);
        res.status(200).json({ message: 'Blog deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error: ", error: error.message });
    }
}
