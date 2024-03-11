import express from 'express';
import { body } from 'express-validator';
import User from '../models/userModel.js';
import { fetchUsers, createUser, loginUser, updateUser, deleteUser, getLoggedInUser, updateProfilePicture, logoutUser } from '../controllers/userController.js';
import { auth } from '../controllers/userAuthMiddleware.js';
import upload from '../controllers/userAuthMiddleware.js';

const route = express.Router();

route.post('/create', [
    body('firstName').not().isEmpty().withMessage('First name is required'),
    body('lastName').not().isEmpty().withMessage('Last name is required'),
    body('username').not().isEmpty().withMessage('Username is required')
        .custom(async (value) => {
            const user = await User.findOne({ username: value });
            if (user) {
                throw new Error('Username already exists');
            }
        }),
    body('phone').isMobilePhone().withMessage('Invalid phone number'),
    body('email').isEmail().withMessage('Invalid email address')
        .custom(async (value) => {
            const user = await User.findOne({ email: value });
            if (user) {
                throw new Error('Email already exists');
            }
        }),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/\d/).withMessage('Password must contain a number')
        .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
        .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
        .matches(/[$&+,:;=?@#|'<>.^*()%!-]/).withMessage('Password must contain a special character')
], createUser);

route.post('/login', [
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').not().isEmpty(),
], loginUser);

route.get('/getAllUsers', fetchUsers);
route.put('/update/:id', upload.single('profilePic'), updateUser);
route.delete('/delete/:id', deleteUser);
route.get('/me', auth, getLoggedInUser);
route.put('/updateProfilePic/:id', auth, upload.single('profilePic'), updateProfilePicture);
route.post('/logout', logoutUser);

export default route;
