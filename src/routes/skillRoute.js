import express from 'express';
import multer from 'multer';
import path from 'path'

import { fetchSkills, createSkill, updateSkill, deleteSkill } from '../controllers/skillController.js';

const sklroute = express.Router();

// Multer configurations
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '/Media/skills')
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

sklroute.post('/create', upload.single('image'), createSkill);
sklroute.get('/getAllSkills', fetchSkills);
sklroute.put('/update/:id', upload.single('image'), updateSkill);
sklroute.delete('/delete/:id', deleteSkill);

export default sklroute;
