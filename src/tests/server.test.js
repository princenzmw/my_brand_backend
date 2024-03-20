import supertest from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const uri = process.env.DB_URI;

const request = supertest(app);

// Mock user data
const userData = {
  firstName: 'Test',
  lastName: 'User',
  username: 'testuser',
  phone: '1234567890',
  email: 'testuser@example.com',
  password: 'Password123!',
};

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
};
beforeAll(async () => {
  await mongoose.connect(uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true
  })
  console.log("Connected to DB");
});

describe('User API tests', () => {
  it('POST /register should create a new user', async () => {
    const response = await request.post('/api/user/register').send(userData);
    // Log complete response object
    console.log(response);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('_id');
  });

  it('POST /register should not create a user with existing email', async () => {
    await request.post('/api/user/register').send(userData);
    const response = await request.post('/api/user/register').send(userData);
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('errors');
  });

  it('POST /login should authenticate user', async () => {
    await request.post('/api/user/register').send(userData);
    const response = await request.post('/api/user/login').send({
      email: userData.email,
      password: userData.password,
    });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  it('POST /login should reject invalid credentials', async () => {
    const response = await request.post('/api/user/login').send({
      email: userData.email,
      password: 'wrongPassword',
    });
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('GET /getAllUsers should not require authorization', async () => {
    const response = await request.get('/api/user/getAllUsers');
    expect(response.statusCode).toBe(200);
  });

  it('GET /getAllUsers should return users for authorized requests', async () => {
    // Mock user creation and authentication to get token
    await request.post('/api/user/register').send(userData);
    const loginResponse = await request.post('/api/user/login').send({
      email: userData.email,
      password: userData.password,
    });
    const token = loginResponse.body.token;

    const response = await request.get('/api/user/getAllUsers').set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('PUT /update/:id should update user data', async () => {
    // Mock user creation and get user ID
    const userResponse = await request.post('/api/user/register').send(userData);
    const userId = userResponse.body._id;

    // Mock user login to get authorization token
    const loginResponse = await request.post('/api/user/login').send({
      email: userData.email,
      password: userData.password,
    });
    const token = loginResponse.body.token;

    // Make the request with the token to update the user
    const response = await request.put(`/api/user/update/${userId}`)
      .send({ firstName: 'UpdatedName' })
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.updatedUser.firstName).toBe('UpdatedName');
  });

  it('DELETE /delete/:id should remove user', async () => {
    // Mock user creation and get user ID
    const userResponse = await request.post('/api/user/register').send(userData);
    const userId = userResponse.body._id;

    // Mock user login to get authorization token
    const loginResponse = await request.post('/api/user/login').send({
      email: userData.email,
      password: userData.password,
    });
    const token = loginResponse.body.token;

    const response = await request.delete(`/api/user/delete/${userId}`).set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message');
  });

  it('GET /me should return the logged-in user data', async () => {
    // Mock user creation and authentication to get token
    await request.post('/api/user/register').send(userData);
    const loginResponse = await request.post('/api/user/login').send({
      email: userData.email,
      password: userData.password,
    });
    const token = loginResponse.body.token;

    const response = await request.get('/api/user/me').set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('email', userData.email);
  });

  it('POST /logout should respond with logout message', async () => {
    const response = await request.post('/api/user/logout');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message', 'Logout successful. Please delete the token on the client side.');
  });
});

afterAll(async () => {
  await mongoose.connection.close(); // Close the MongoDB connection after all tests are done
});
