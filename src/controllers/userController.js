import User from '../models/userModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const createUser = async (req, res) => {
    try {
        const userData = new User(req.body);
        const { email } = userData;

        const userExist = await User.findOne({ email })
        if (userExist) {
            return res.status(400).json({ message: 'User already exists.' });
        }

        const savedUser = await userData.save();
        res.status(200).json(savedUser);
    }
    catch (err) {
        res.status(500).json({ err: "Internal Server Error." });
    }
}

export const fetchUsers = async (req, res) => {
    try {
        const users = await User.find();
        if (users.length === 0) {
            return res.status(404).json({ message: 'No users found.' });
        }
        res.status(200).json(users);
    }
    catch (err) {
        res.status(500).json({ err: "Internal Server Error." });
    }
}

export const updateUser = async (req, res) => {
    try {
        const id = req.params.id;
        const { password } = req.body;
        const userExists = await User.findById({ _id: id });
        if (!userExists) {
            return res.status(404).json({ message: 'User not found.' });
        }
        // If the password is being updated, hash the new password before saving
        if (password) {
            const salt = await bcrypt.genSalt(10);
            req.body.password = await bcrypt.hash(password, salt);
        }
        const updatedUser = await User.findByIdAndUpdate(id, req.body, { new: true }).select('-password');
        res.status(200).json([{ message: "User Updated successfully" }, updatedUser]);

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error." });
    }
}

export const deleteUser = async (req, res) => {
    try {
        const id = req.params.id;
        const userExists = await User.findById({ _id: id });
        if (!userExists) {
            return res.status(404).json({ message: 'User not found.' });
        }
        await User.findByIdAndDelete(id);
        res.status(201).json({ message: 'User deleted successfully.' });

    } catch (error) {
        res.status(500).json({ error: "Internal Server Error." });
    }
}

// ... other methods ...

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
        res.status(500).json({ err: "Internal Server Error." });
    }
}

export const getLoggedInUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password'); // exclude password
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error." });
    }
}

export const logoutUser = (req, res) => {
    // Inform the client to delete the token
    res.status(200).json({ message: 'Logout successful. Please delete the token on the client side.' });
}