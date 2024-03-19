import supertest from 'supertest';
import app from '../server.js';
import User from '../models/userModel.js';
import { auth } from '../middleware/userAuthMiddleware.js';
import cloudinary from 'cloudinary';
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

// Mock User model and other dependencies
jest.mock('../models/userModel.js');
jest.mock('../middleware/userAuthMiddleware.js', () => ({
  auth: jest.fn((req, res, next) => next()),
}));

const request = supertest(app);

describe('User API endpoints', () => {
  // Register User Endpoint Tests
  describe('POST /register', () => {
    const newUser = {
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      phone: '1234567890',
      email: 'testuser@example.com',
      password: 'Password@123'
    };

    test('should successfully register a new user', async () => {
      User.findOne.mockResolvedValueOnce(null);
      User.prototype.save.mockResolvedValueOnce(newUser);

      const response = await request.post('/register').send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.user).toBeDefined();
    });

    test('should fail to register a user with existing username', async () => {
      User.findOne.mockResolvedValueOnce(newUser);

      const response = await request.post('/register').send(newUser);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    test('should fail to register a user with invalid data', async () => {
      const response = await request.post('/register').send({});

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  // Login User Endpoint Tests
  describe('POST /login', () => {
    const userCredentials = {
      email: 'testuser@example.com',
      password: 'Password@123'
    };

    test('should successfully log in a user', async () => {
      User.findOne.mockResolvedValueOnce({ email: userCredentials.email, password: userCredentials.password });

      const response = await request.post('/login').send(userCredentials);

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
    });

    test('should fail to log in with invalid credentials', async () => {
      User.findOne.mockResolvedValueOnce(null);

      const response = await request.post('/login').send(userCredentials);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  // Fetch All Users Endpoint Tests
  describe('GET /getAllUsers', () => {
    test('should return a list of all users', async () => {
      User.find.mockResolvedValueOnce([/* array of user data */]);

      const response = await request.get('/getAllUsers');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('should handle errors when fetching all users', async () => {
      User.find.mockRejectedValueOnce(new Error('Database error'));

      const response = await request.get('/getAllUsers');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal Server Error.');
    });
  });

  // Update User Endpoint Tests
  describe('PUT /update/:id', () => {
    const userId = 'validUserId';
    const updateData = { phone: '0987654321' };

    test('should successfully update user data', async () => {
      User.findById.mockResolvedValueOnce({ _id: userId });
      User.findByIdAndUpdate.mockResolvedValueOnce({ _id: userId, ...updateData });

      const response = await request.put(`/update/${userId}`).send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
    });

    test('should return error when user not found', async () => {
      User.findById.mockResolvedValueOnce(null);

      const response = await request.put(`/update/${userId}`).send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found.');
    });
  });

  // Delete User Endpoint Tests
  describe('DELETE /delete/:id', () => {
    const userId = 'validUserId';

    test('should successfully delete a user', async () => {
      User.findById.mockResolvedValueOnce({ _id: userId });
      User.findByIdAndDelete.mockResolvedValueOnce({ _id: userId });

      const response = await request.delete(`/delete/${userId}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User deleted successfully.');
    });

    test('should return error when user not found', async () => {
      User.findById.mockResolvedValueOnce(null);

      const response = await request.delete(`/delete/${userId}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found.');
    });
  });

  // Get Logged In User Endpoint Tests
  describe('GET /me', () => {
    const userId = 'validUserId';

    test('should return the logged in user details', async () => {
      User.findById.mockResolvedValueOnce({ _id: userId, email: 'testuser@example.com' });

      const response = await request.get('/me');

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('testuser@example.com');
    });

    test('should return error when user not found', async () => {
      User.findById.mockResolvedValueOnce(null);

      const response = await request.get('/me');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found.');
    });
  });

  // Update Profile Picture Endpoint Tests
  describe('PUT /updateProfilePic/:id', () => {
    const userId = 'validUserId';
    const profilePicData = { path: 'newProfilePicUrl', public_id: 'newProfilePicPublicId' };

    test('should successfully update profile picture', async () => {
      User.findById.mockResolvedValueOnce({ _id: userId, profilePic: 'oldProfilePicUrl', profilePicPublicId: 'oldProfilePicPublicId' });
      User.findByIdAndUpdate.mockResolvedValueOnce({ _id: userId, ...profilePicData });

      const response = await request.put(`/updateProfilePic/${userId}`).send(profilePicData);

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
    });

    test('should return error when user not found', async () => {
      User.findById.mockResolvedValueOnce(null);

      const response = await request.put(`/updateProfilePic/${userId}`).send(profilePicData);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found.');
    });
  });

  // Logout User Endpoint Tests
  describe('POST /logout', () => {
    test('should logout a user', async () => {
      const response = await request.post('/logout');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logout successful. Please delete the token on the client side.');
    });
  });
});
