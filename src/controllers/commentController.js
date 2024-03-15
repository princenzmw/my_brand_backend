import Comment from '../models/commentModel.js';
import Blog from '../models/blogModel.js';

export const createComment = async (req, res) => {
  try {
    const { text, blogId } = req.body;
    const comment = await Comment.create({
      text,
      author: req.user.userId,
      blog: blogId,
    });

    // Push comment ref to blog comments field
    const blog = await Blog.findById(blogId);
    blog.comments.push(comment._id);
    await blog.save();

    res.status(201).json({
      message: 'Comment Created Successfully!',
      comment,
    })
  } catch (error) {
    res.status(500).json({ message: "There was a problem creating the comment.", error: error.message });
  }
}

export const fetchComments = async (req, res) => {
  try {
    const comments = await Comment.find({ blog: req.params.blogId })
      .populate('author', 'username');
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: "There was a problem fetching the comments.", error: error.message });
  }
}

export const updateComment = async (req, res) => {
  try {
    const { text } = req.body;
    const comment = await Comment.findById(req.params.id);

    // Check if the comment exists
    if (!comment) {
      return res.status(404).json({ message: "Comment not found." })
    }

    // Check if the user requesting the update is the author of the comment
    if (comment.author.toString() !== req.user.userId) {
      return res.status(403).json({ message: "You do not have permission to update this comment." });
    }

    comment.text = text || comment.text;
    const updatedComment = await comment.save();

    res.status(200).json(updatedComment);
  } catch (error) {
    res.status(500).json({ message: "There was a problem updating the comment.", error: error.message });
  }
}

export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    // Check if the comment exists
    if (!comment) {
      return res.status(404).json({ message: "Comment not found." })
    }

    // Check if the user requesting the deletion is the author of the comment
    if (comment.author.toString() !== req.user.userId) {
      return res.status(403).json({ message: "You do not have permission to delete this comment." });
    }

    await Comment.findByIdAndRemove(req.params.id);

    res.status(200).json({ message: 'Comment deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: "There was a problem deleting the comment.", error: error.message });
  }
}
