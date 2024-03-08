import express from 'express';
import { body } from 'express-validator';
import { fetchUsers, createUser, loginUser, updateUser, deleteUser, getLoggedInUser, logoutUser } from '../controllers/userController.js';
import { auth } from '../controllers/userAuthMiddleware.js';

const route = express.Router();

route.post('/create', [
    body('firstName').not().isEmpty().withMessage('First name is required'),
    body('lastName').not().isEmpty().withMessage('Last name is required'),
    body('username').not().isEmpty().withMessage('Username is required'),
    body('phone').isMobilePhone().withMessage('Invalid phone number'),
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
], createUser);

route.post('/login', [
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').not().isEmpty(),
], loginUser);

route.get('/me', auth, getLoggedInUser);
route.get('/getAllUsers', fetchUsers);
route.put('/update/:id', updateUser);
route.delete('/delete/:id', deleteUser);
route.post('/logout', logoutUser);

export default route;

