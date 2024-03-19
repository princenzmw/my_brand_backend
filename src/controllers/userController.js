import User from '../models/userModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';

const DEFAULT_PROFILE_PIC = "https://res.cloudinary.com/dm7fqrcv7/image/upload/v1710810617/Media/profiles/avatar/ajparwuedre2uc0varnu.webp";
const DEFAULT_PROFILE_PIC_PUBLIC_ID = "Media/profiles/avatar/ajparwuedre2uc0varnu";

const deleteOldProfilePic = async (oldProfilePicPublicId) => {
    if (oldProfilePicPublicId) {
        try {
            await cloudinary.uploader.destroy(oldProfilePicPublicId);
        } catch (error) {
            console.error(`Could not delete old image on Cloudinary: ${error.message}`);
        }
    }
};

export const createUser = async (req, res) => {
    try {
        const { firstName, lastName, username, phone, email, password } = req.body;
        const userExist = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] });
        if (userExist) {
            return res.status(400).send({ error: 'User already exists with the given email or username.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({
            firstName,
            lastName,
            username: username.toLowerCase(),
            phone,
            email: email.toLowerCase(),
            password: hashedPassword,
            profilePic: DEFAULT_PROFILE_PIC,
            profilePicPublicId: DEFAULT_PROFILE_PIC_PUBLIC_ID
        });
        const savedUser = await newUser.save();
        res.status(201).send({ user: savedUser.toObject({ getters: true, virtuals: false }) });
    } catch (err) {
        console.error("Error in createUser: ", err);
        res.status(500).send({ error: "Internal Server Error." });
    }
};

export const fetchUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).send(users);
    } catch (err) {
        console.error("Error in Getting Users: ", err);
        res.status(500).send({ error: "Internal Server Error." });
    }
}

export const updateUser = async (req, res) => {
    try {
        const id = req.params.id;
        const updates = req.body;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).send({ error: 'User not found.' });
        }

        if (req.file && user.profilePicPublicId !== DEFAULT_PROFILE_PIC_PUBLIC_ID) {
            await deleteOldProfilePic(user.profilePicPublicId);
        }

        // Update user fields
        Object.keys(updates).forEach((updateField) => {
            if (updateField !== 'password') {
                user[updateField] = updates[updateField];
            }
        });

        if (req.file) {
            user.profilePic = req.file.path;
            user.profilePicPublicId = req.file.public_id;
        }

        if (updates.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(updates.password, salt);
        }

        await user.save();

        res.status(200).send({ message: "User updated successfully", user: user.toObject({ getters: true, virtuals: false }) });
    } catch (error) {
        console.error("Error in updateUser: ", error);
        res.status(500).send({ error: "Internal Server Error." });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).send({ error: 'User not found.' });
        }

        if (user.profilePicPublicId && user.profilePicPublicId !== DEFAULT_PROFILE_PIC_PUBLIC_ID) {
            await deleteOldProfilePic(user.profilePicPublicId);
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
            return res.status(400).send({ error: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send({ error: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).send({ token });
    } catch (err) {
        console.error("Error in Login: ", err);
        res.status(500).send({ error: "Internal Server Error." });
    }
};

export const getLoggedInUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).send({ error: 'User not found.' });
        }
        res.status(200).send(user);
    } catch (error) {
        console.error("Error in getting current logged user: ", error);
        res.status(500).send({ error: "Internal Server Error." });
    }
}

export const updateProfilePicture = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send({ error: 'User not found.' });
        }

        if (req.file) {
            // Check if the current picture is not the default one before deleting
            if (user.profilePicPublicId && user.profilePicPublicId !== DEFAULT_PROFILE_PIC_PUBLIC_ID) {
                await cloudinary.uploader.destroy(user.profilePicPublicId);
            }

            // Update the user with the new image URL and public ID from Cloudinary
            user.profilePic = req.file.path;
            user.profilePicPublicId = req.file.public_id;
            await user.save();

            res.status(200).send({ message: "Profile picture updated successfully", user });
        } else {
            res.status(400).send({ error: "No profile picture provided." });
        }
    } catch (error) {
        console.error("Error in updating profile picture: ", error);
        res.status(500).send({ error: "Internal Server Error." });
    }
};

export const logoutUser = (req, res) => {
    res.status(200).send({ message: 'Logout successful. Please delete the token on the client side.' });
}
