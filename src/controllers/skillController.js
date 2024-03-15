import Skill from '../models/skillModel.js';
import fs from 'fs';

export const createSkill = async (req, res) => {
    try {
        const { title, description } = req.body;
        const image = req.file ? req.file.path : "default/path";

        const newSkill = new Skill({
            title,
            image,
            description
        });

        await newSkill.save(); // Save the new skill to the database

        res.status(201).send('Skill added successfully!');
    } catch (error) {
        res.status(500).send({ message: 'An error occurred while adding the skill', error: error.message });
    }
}

export const fetchSkills = async (req, res) => {
    try {
        const skills = await Skill.find();
        if (skills.length === 0) {
            return res.status(404).json({ message: 'No skills found.' });
        }

        // Check each skill for an existing image file
        const skillsProcessed = await Promise.all(skills.map(async (skill) => {
            if (skill.image && !fs.existsSync(skill.image)) {
                // Image file does not exist, set to default path
                skill.image = "default/path";
                await Skill.findByIdAndUpdate(skill._id, { image: "default/path" });
            }
            return skill;
        }));

        res.status(200).json(skillsProcessed);
    } catch (err) {
        res.status(500).json({ message: "Internal Server Error: ", error: err.message });
    }
}

export const updateSkill = async (req, res) => {
    try {
        const id = req.params.id;
        const { title, description } = req.body;
        const newImage = req.file ? req.file.path : null;

        const skillExists = await Skill.findById(id);
        if (!skillExists) {
            return res.status(404).json({ message: 'Skill not found.' });
        }

        if (newImage && skillExists.image && fs.existsSync(skillExists.image) && skillExists.image !== "default/path") {
            // Delete the existing image file safely
            try {
                await fs.promises.unlink(skillExists.image);
            } catch (error) {
                return res.status(500).json({ message: `Could not delete old image file: ${error.message}` });
            }
        }

        const updatedData = {
            title: title || skillExists.title,
            description: description || skillExists.description,
            image: newImage || skillExists.image
        };

        const updatedSkill = await Skill.findByIdAndUpdate(id, updatedData, { new: true, runValidators: true });
        res.status(200).json({ message: "Skill Updated successfully", skill: updatedSkill });

    } catch (error) {
        res.status(500).json({ message: "Internal Server Error: ", error: error.message });
    }
}


export const deleteSkill = async (req, res) => {
    try {
        const id = req.params.id;
        const skillExists = await Skill.findById(id);
        if (!skillExists) {
            return res.status(404).json({ message: 'Skill not found.' });
        }

        const deleteImageFile = async () => {
            if (fs.existsSync(skillExists.image)) {
                await fs.promises.unlink(skillExists.image);
            }
        };

        await deleteImageFile();

        await Skill.findByIdAndDelete(id);
        res.status(200).json({ message: 'Skill deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error: ", error: error.message });
    }
}
