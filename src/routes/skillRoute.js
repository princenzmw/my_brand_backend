import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { fetchSkills, fetchSkill, createSkill, updateSkill, deleteSkill } from '../controllers/skillController.js';
import auth from '../middleware/authentication.js';

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'skillImages',
        format: async (req, file) => 'png',
    },
});
const upload = multer({ storage });

const skillRoute = express.Router();

skillRoute.get('/', fetchSkills);
skillRoute.get('/:id', fetchSkill);
skillRoute.post('/create', auth, upload.single('image'), createSkill);
skillRoute.put('/update/:id', auth, upload.single('image'), updateSkill);
skillRoute.delete('/delete/:id', auth, deleteSkill);

export default skillRoute;
