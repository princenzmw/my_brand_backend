import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  blog: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
}, { timestamps: true });


const Comment = mongoose.model('Comment', commentSchema); // Use 'Comment' as the model name
export default Comment;
