import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { fetchProjects, fetchProject, createProject, updateProject, deleteProject } from '../controllers/projectController.js';
import auth from '../middleware/authentication.js';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'projectImages',
    format: async (req, file) => 'png',
  },
});
const upload = multer({ storage });

const projectRoute = express.Router();

projectRoute.get('/', fetchProjects);
projectRoute.get('/:id', fetchProject);
projectRoute.post('/create', auth, upload.single('image'), createProject);
projectRoute.put('/update/:id', auth, upload.single('image'), updateProject);
projectRoute.delete('/delete/:id', auth, deleteProject);

export default projectRoute;
