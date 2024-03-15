import express from 'express';
import User from '../models/userModel.js';
import { body, param, validationResult } from 'express-validator';
import { fetchUsers, createUser, loginUser, updateUser, deleteUser, getLoggedInUser, updateProfilePicture, logoutUser } from '../controllers/userController.js';
import { auth } from '../middleware/userAuthMiddleware.js';
import upload from '../middleware/userAuthMiddleware.js';

const route = express.Router();

// Function to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

route.post('/register', [
    body('firstName').not().isEmpty().withMessage('First name is required'),
    body('lastName').not().isEmpty().withMessage('Last name is required'),
    body('username').not().isEmpty().withMessage('Username is required')
        .custom(async (value) => {
            const user = await User.findOne({ username: value });
            if (user) {
                return Promise.reject('Username already exists');
            }
        }),
    body('phone').isMobilePhone().withMessage('Invalid phone number'),
    body('email').isEmail().withMessage('Invalid email address')
        .custom(async (value) => {
            const user = await User.findOne({ email: value.toLowerCase() });
            if (user) {
                return Promise.reject('Email already exists');
            }
        }),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/\d/).withMessage('Password must contain a number')
        .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
        .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
        .matches(/[$&+,:;=?@#|'<>.^*()%!-]/).withMessage('Password must contain a special character'),
    handleValidationErrors
], createUser);

route.post('/login', [
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').not().isEmpty().withMessage('Password is required'),
    handleValidationErrors
], loginUser);

route.get('/getAllUsers', fetchUsers);

route.put('/update/:id', [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('username').optional().custom(async (value, { req }) => {
        if (value) {
            const user = await User.findOne({ username: value });
            if (user && user._id.toString() !== req.params.id) {
                return Promise.reject('Username already exists');
            }
        }
    }),
    body('email').optional().isEmail().withMessage('Invalid email address').custom(async (value, { req }) => {
        if (value) {
            const user = await User.findOne({ email: value.toLowerCase() });
            if (user && user._id.toString() !== req.params.id) {
                return Promise.reject('Email already exists');
            }
        }
    }),
    handleValidationErrors
], auth, upload.single('profilePic'), updateUser);

route.delete('/delete/:id', [
    param('id').isMongoId().withMessage('Invalid user ID'),
    handleValidationErrors
], auth, deleteUser);

route.get('/me', auth, getLoggedInUser);

route.put('/updateProfilePic/:id', [
    param('id').isMongoId().withMessage('Invalid user ID'),
    handleValidationErrors
], auth, upload.single('profilePic'), updateProfilePicture);

route.post('/logout', logoutUser);

export default route;
