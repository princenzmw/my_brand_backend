import Project from '../models/projectModel.js';
import cloudinary from 'cloudinary';
import { isAdmin } from '../middleware/authentication.js';

export const fetchProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('author', 'username');
    if (!project) {
      return res.status(404).json({ message: 'No project found.' });
    }
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}

export const fetchProjects = async (req, res) => {
  try {
    const PAGE_SIZE = 5; // Number of projects per page
    const page = parseInt(req.query.page || "0");
    const total = await Project.countDocuments({});

    const projects = await Project.find()
      .limit(PAGE_SIZE)
      .skip(PAGE_SIZE * page)
      .populate('author', 'username');

    if (!projects.length) {
      return res.status(404).json({ message: 'No projects found.' });
    }

    res.status(200).json({ totalPages: Math.ceil(total / PAGE_SIZE), projects });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}

export const createProject = async (req, res) => {
  try {
    const { title, content } = req.body;
    const author = req.user.userId;

    if (!title || title.length < 5 || !content || content.length < 15) {
      return res.status(400).json({ message: 'Please provide a title with at least 5 characters and content with at least 15 characters.' });
    }

    let image;
    if (req.file) image = req.file.filename;

    const newProject = new Project({ title, image, content, author });

    const savedProject = await newProject.save();

    res.status(201).json({ message: 'Project added successfully!', project: savedProject });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid project data', error: error.message });
    }
    res.status(500).json({ message: 'An error occurred while adding the project', error: error.message });
  }
}

export const updateProject = async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { title, content } = req.body;
  const newImage = req.file ? req.file.filename : null;

  if (!(await isAdmin(userId))) {
    return res.status(403).json({ message: 'Access denied. Only admins can update projects.' });
  }

  try {
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (newImage && project.image) {
      let result = await cloudinary.uploader.destroy(project.image); // Delete old image
      if (result.error) {
        return res.status(500).json({ message: 'Failed to delete old image.' });
      }
    }

    const updatedData = {
      title: title || project.title,
      content: content || project.content,
      image: newImage ? newImage : project.image
    };

    const updatedProject = await Project.findByIdAndUpdate(id, updatedData, { new: true, runValidators: true });
    res.status(200).json({ message: "Project updated successfully", project: updatedProject });

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}

export const deleteProject = async (req, res) => {
  if (!await isAdmin(req.user.userId)) {
    return res.status(403).json({ message: 'Access denied. Only admins can delete projects.' });
  }

  try {
    const id = req.params.id;
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    let result = await cloudinary.uploader.destroy(project.image); // Corrected
    if (result.error) {
      return res.status(500).json({ message: 'Failed to delete image from cloud.', error: result.error });
    }

    await Project.findByIdAndDelete(id);
    res.status(200).json({ message: 'Project deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}
