import mongoose from "mongoose";

// A schema for the blog
const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    image: String, // Store the path to the image
    description: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compile our model
const Blog = mongoose.model('Blog', blogSchema);
export default Blog;
