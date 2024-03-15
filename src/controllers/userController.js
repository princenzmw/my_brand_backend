import User from '../models/userModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const deleteOldProfilePic = async (userId) => {
    const user = await User.findById(userId);
    const defaultProfilePic = User.schema.paths.profilePic.default;
    const oldProfilePicPath = path.join(__dirname, '..', user.profilePic);

    if (user.profilePic !== defaultProfilePic && fs.existsSync(oldProfilePicPath)) {
        await fs.promises.unlink(oldProfilePicPath);
    }
};

export const createUser = async (req, res) => {
    try {
        const { firstName, lastName, username, phone, email, password, role } = req.body;
        const userExist = await User.findOne({ $or: [{ email }, { username }] });
        if (userExist) {
            return res.status(400).json({ message: 'User already exists with the given email or username.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const userData = new User({ firstName, lastName, username, phone, email, password: hashedPassword, role });
        const savedUser = await userData.save();
        res.status(201).json(savedUser);
    } catch (err) {
        console.error("Error in createUser: ", err);
        res.status(500).json({ err: "Internal Server Error." });
    }
}

export const fetchUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (err) {
        console.error("Error in Getting Users: ", err);
        res.status(500).json({ err: "Internal Server Error." });
    }
}

export const updateUser = async (req, res) => {
    try {
        const id = req.params.id;
        const updates = req.body;

        if (req.file) {
            await deleteOldProfilePic(id);
            updates.profilePic = "/Media/profiles/" + req.file.filename;
        }

        if (updates.password) {
            const salt = await bcrypt.genSalt(10);
            updates.password = await bcrypt.hash(updates.password, salt);
        }

        const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
        res.status(200).json({ message: "User Updated successfully", updatedUser });
    } catch (error) {
        console.error("Error in updating User: ", error);
        res.status(500).json({ error: "Internal Server Error." });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const id = req.params.id;
        await deleteOldProfilePic(id);
        await User.findByIdAndDelete(id);
        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error("Error in deleteUser: ", error);
        res.status(500).json({ error: "Internal Server Error." });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ token });
    } catch (err) {
        console.error("Error in Login: ", err);
        res.status(500).json({ err: "Internal Server Error." });
    }
};

export const getLoggedInUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password'); // exclude password
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error("Error in getting current logged user: ", error);
        res.status(500).json({ error: "Internal Server Error." });
    }
}

export const updateProfilePicture = async (req, res) => {
    try {
        const id = req.params.id;

        if (req.file) {
            await deleteOldProfilePic(id);
            const profilePicPath = "/Media/profiles/" + req.file.filename;
            const updatedUserPic = await User.findByIdAndUpdate(id, { profilePic: profilePicPath }, { new: true }).select('-password');
            res.status(200).json({ message: "User Profile Picture Updated successfully", updatedUserPic });
        } else {
            res.status(400).json({ error: "No profile picture provided." });
        }
    } catch (error) {
        console.error("Error in updating user profilePic: ", error);
        res.status(500).json({ error: "Internal Server Error." });
    }
};

export const logoutUser = (req, res) => {
    // Inform the client to delete the token
    res.status(200).json({ message: 'Logout successful. Please delete the token on the client side.' });
}
