import request from 'supertest';
import express from 'express';
import userRoutes from '../routes/userRoute';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { MongoMemoryServer } from 'mongodb-memory-server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use('/api/user', userRoutes);

const mongoServer = new MongoMemoryServer();

let userData;
let token;

beforeAll(async () => {
  await mongoServer.start();
  const mongoUri = await mongoServer.getUri();
  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })

  userData = {
    firstName: 'Test',
    lastName: 'User',
    username: 'testUser',
    email: 'test@mail.com',
    password: 'Test@123',
    phone: '1234567890'
  };

  let res = await request(app)
    .post('/api/user/create')
    .send(userData);
  userData.id = res.body.id;

  res = await request(app)
    .post('/api/user/login')
    .send({
      email: userData.email,
      password: userData.password,
    });

  token = res.body.token; // Store the token for later tests
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('User API endpoints', () => {
  // Test for GET /api/user/getAllUsers route
  it('should fetch all users', async () => {
    const res = await request(app).get('/api/user/getAllUsers');
    expect(res.statusCode).toEqual(200);
  });

  // Test for POST /api/user/login
  it('should login a user and return a token', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({
        email: userData.email,
        password: userData.password,
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  // Test PUT /api/user/updateProfilePic/1
  it('should update a user profile picture', async () => {
    const res = await request(app)
      .put(`/api/user/updateProfilePic/${userData.id}`)
      .set("Authorization", `Bearer ${token}`)
      .attach('profilePic', `${__dirname}/Media/profiles/image.webp`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe('User Profile Picture Updated successfully');
  });

  // Test POST /api/user/logout
  it('should inform the client to delete the token', async () => {
    const res = await request(app)
      .post('/api/user/logout')
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe('Logout successful. Please delete the token on the client side.');
  });
});

// Test for POST /api/user/create route
describe('More User API endpoints', () => {
  const newUser = {
    firstName: 'Test',
    lastName: 'Test',
    username: 'testUser1',
    email: 'test1@mail.com',
    password: 'Test@123',
    phone: '1234567890'
  };

  // Test for updating a user
  it('should update a user', async () => {
    const res = await request(app)
      .put(`/api/user/update/${userData.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Updated', lastName: 'User' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.updatedUser.firstName).toEqual('Updated');
  });

  it('should create a new user', async () => {
    const res = await request(app)
      .post('/api/user/create')
      .send(newUser);
    expect(res.statusCode).toEqual(201);
  });

  // Test for Logging in
  it('should login a user and return a token', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({
        email: newUser.email,
        password: newUser.password,
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token; // Store the token for later tests
  });

  // Test for updating a user
  it('should update a user', async () => {
    const res = await request(app)
      .put(`/api/user/update/${newUser.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Updated', lastName: 'User' })
    expect(res.statusCode).toEqual(200);
    expect(res.body.updatedUser.firstName).toEqual('Updated');
  });

  // Test Logout User
  it('should inform the client to delete the token', async () => {
    const res = await request(app)
      .post('/api/user/logout')
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe('Logout successful. Please delete the token on the client side.');
  });
});
// Test for POST /api/user/create route
describe('More User API endpoints', () => {

  // Assuming there's a user in DB with id 1
  const existingUserId = 1;

  // Some shared properties used in tests
  const newUser = {
    firstName: 'Test',
    lastName: 'Test',
    username: 'testUser1',
    email: 'test1@mail.com',
    password: 'Test@123',
    phone: '1234567890'
  };

  let token;

  it('should create a new user', async () => {
    const res = await request(app)
      .post('/api/user/create')
      .send(newUser);
    expect(res.statusCode).toEqual(201);
  });

  // Test for Logging in
  it('should login a user and return a token', async () => {
    const res = await request(app)
      .post('/api/user/login')
      .send({
        email: newUser.email,
        password: newUser.password,
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token; // Store the token for later tests
  });

  // Test for updating a user
  it('should update a user', async () => {
    const res = await request(app)
      .put(`/api/user/update/${existingUserId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Updated', lastName: 'User' })
    expect(res.statusCode).toEqual(200);
    expect(res.body.updatedUser.firstName).toEqual('Updated');
  });

  // Test Logout User
  it('should inform the client to delete the token', async () => {
    const res = await request(app)
      .post('/api/user/logout')
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe('Logout successful. Please delete the token on the client side.');
  });
});
