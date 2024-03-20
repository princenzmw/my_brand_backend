import Skill from '../models/skillModel.js';
import cloudinary from 'cloudinary';
import { isAdmin } from '../middleware/authentication.js';

export const fetchSkill = async (req, res) => {
    try {
        const skill = await Skill.findById(req.params.id).populate('author', 'username');
        if (!skill) {
            return res.status(404).json({ message: 'No skill found.' });
        }
        res.status(200).json(skill);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

export const fetchSkills = async (req, res) => {
    try {
        const PAGE_SIZE = 5; // Number of skills per page
        const page = parseInt(req.query.page || "0");
        const total = await Skill.countDocuments({});

        const skills = await Skill.find()
            .limit(PAGE_SIZE)
            .skip(PAGE_SIZE * page)
            .populate('author', 'username');

        if (!skills.length) {
            return res.status(404).json({ message: 'No skills found.' });
        }

        res.status(200).json({ totalPages: Math.ceil(total / PAGE_SIZE), skills });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

export const createSkill = async (req, res) => {
    try {
        const { title, content } = req.body;
        const author = req.user.userId;

        if (!title || title.length < 5 || !content || content.length < 15) {
            return res.status(400).json({ message: 'Please provide a title with at least 5 characters and content with at least 15 characters.' });
        }

        let image;
        if (req.file) image = req.file.filename;

        const newSkill = new Skill({ title, image, content, author });

        const savedSkill = await newSkill.save();

        res.status(201).json({ message: 'Skill added successfully!', skill: savedSkill });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Invalid skill data', error: error.message });
        }
        res.status(500).json({ message: 'An error occurred while adding the skill', error: error.message });
    }
}

export const updateSkill = async (req, res) => {
    const { userId } = req.user;
    const { id } = req.params;
    const { title, content } = req.body;
    const newImage = req.file ? req.file.filename : null;

    if (!(await isAdmin(userId))) {
        return res.status(403).json({ message: 'Access denied. Only admins can update skills.' });
    }

    try {
        const skill = await Skill.findById(id);
        if (!skill) {
            return res.status(404).json({ message: 'Skill not found.' });
        }

        if (newImage && skill.image) {
            let result = await cloudinary.uploader.destroy(skill.image); // Delete old image
            if (result.error) {
                return res.status(500).json({ message: 'Failed to delete old image.' });
            }
        }

        const updatedData = {
            title: title || skill.title,
            content: content || skill.content,
            image: newImage ? newImage : skill.image
        };

        const updatedSkill = await Skill.findByIdAndUpdate(id, updatedData, { new: true, runValidators: true });
        res.status(200).json({ message: "Skill updated successfully", skill: updatedSkill });

    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

export const deleteSkill = async (req, res) => {
    if (!await isAdmin(req.user.userId)) {
        return res.status(403).json({ message: 'Access denied. Only admins can delete skills.' });
    }

    try {
        const id = req.params.id;
        const skill = await Skill.findById(id);
        if (!skill) {
            return res.status(404).json({ message: 'Skill not found.' });
        }

        let result = await cloudinary.uploader.destroy(skill.image); // Corrected
        if (result.error) {
            return res.status(500).json({ message: 'Failed to delete image from cloud.', error: result.error });
        }

        await Skill.findByIdAndDelete(id);
        res.status(200).json({ message: 'Skill deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}
