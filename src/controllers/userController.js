import User from '../models/userModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PROFILE_PIC = "/Media/profiles/user_avatars/defaultUserProfileIcon.webp";

const deleteOldProfilePic = async (userId, oldProfilePicPath) => {
    const user = await User.findById(userId);

    if (user.profilePic !== DEFAULT_PROFILE_PIC) {
        try {
            const fullPath = path.join(__dirname, '..', '..', oldProfilePicPath);
            await fs.promises.unlink(fullPath);
        } catch (error) {
            if (error.code !== 'ENOENT') { //the file does not exist
                throw error;
            }
            console.log({ message: `Could not delete old image file: ${error.message}` });
        }
    }
};

export const createUser = async (req, res) => {
    try {
        const { firstName, lastName, username, phone, email, password, role } = req.body;
        const userExist = await User.findOne({ $or: [{ email }, { username }] });
        if (userExist) {
            return res.status(400).send({ message: 'User already exists with the given email or username.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const userData = new User({ firstName, lastName, username, phone, email, password: hashedPassword, role });
        const savedUser = await userData.save();
        res.status(201).send(savedUser);
    } catch (err) {
        console.error("Error in createUser: ", err);
        res.status(500).send({ err: "Internal Server Error." });
    }
}

export const fetchUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).send(users);
    } catch (err) {
        console.error("Error in Getting Users: ", err);
        res.status(500).send({ err: "Internal Server Error." });
    }
}

export const updateUser = async (req, res) => {
    try {
        const id = req.params.id;
        const updates = req.body;
        const user = await User.findById(id);

        if (req.file) {
            const oldProfPicPath = user.profilePic;
            const newProfilePicPath = "/Media/profiles/" + req.file.filename;

            if (oldProfPicPath && oldProfPicPath !== DEFAULT_PROFILE_PIC) {
                await deleteOldProfilePic(id, oldProfPicPath);
            }
            updates.profilePic = newProfilePicPath;
        }

        if (updates.password) {
            const salt = await bcrypt.genSalt(10);
            updates.password = await bcrypt.hash(updates.password, salt);
        }

        const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
        res.status(200).send({ message: "User Updated successfully", updatedUser });
    } catch (error) {
        console.error("Error in updating User: ", error);
        res.status(500).send({ error: "Internal Server Error." });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).send({ message: 'User not found.' });
        }


        if (user.profilePic && user.profilePic !== DEFAULT_PROFILE_PIC) {
            await deleteOldProfilePic(id, user.profilePic);
        }

        await User.findByIdAndDelete(id);

        res.status(200).send({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error("Error in deleteUser: ", error);
        res.status(500).send({ error: "Internal Server Error." });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send({ message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send({ message: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).send({ token });
    } catch (err) {
        console.error("Error in Login: ", err);
        res.status(500).send({ err: "Internal Server Error." });
    }
};

export const getLoggedInUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).send({ message: 'User not found.' });
        }
        res.status(200).send(user);
    } catch (error) {
        console.error("Error in getting current logged user: ", error);
        res.status(500).send({ error: "Internal Server Error." });
    }
}

export const updateProfilePicture = async (req, res) => {
    try {
        const id = req.params.id;

        if (req.file) {
            const newProfilePicPath = "/Media/profiles/" + req.file.filename;
            await deleteOldProfilePic(id, newProfilePicPath);
            const updatedUserPic = await User.findByIdAndUpdate(id, { profilePic: newProfilePicPath }, { new: true }).select('-password');
            res.status(200).send({ message: "User Profile Picture Updated successfully", updatedUserPic });
        } else {
            res.status(400).send({ error: "No profile picture provided." });
        }
    } catch (error) {
        console.error("Error in updating user profilePic: ", error);
        res.status(500).send({ error: "Internal Server Error." });
    }
};

export const logoutUser = (req, res) => {
    // Inform the client to delete the token
    res.status(200).send({ message: 'Logout successful. Please delete the token on the client side.' });
}
