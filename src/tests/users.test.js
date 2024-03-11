import supertest from 'supertest';
import app from '../server.js';
import User from '../models/userModel.js';
import mongoose from 'mongoose';


jest.mock('../models/userModel.js'); // This line automatically sets all modules methods to jest.fn

beforeAll(async () => {
    // Connect to a Mongo DB
    await mongoose.connect(global.__MONGO_URI__, { useNewUrlParser: true, useCreateIndex: true }, (err) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
    });
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('User API', () => {
    describe('POST /create', () => {
        it('should create a new user', async () => {
            const newUser = {
                firstName: 'John',
                lastName: 'Doe',
                username: 'john.doe',
                phone: '1234567890',
                email: 'john.doe@example.com',
                password: 'password123'
            };

            User.findOne.mockResolvedValue(null); // Assume no user is found
            User.prototype.save.mockResolvedValue(newUser); // Assume we can save a new user

            const res = await request(app)
                .post('/api/user/create')
                .send(newUser);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('_id');
            expect(User.prototype.save).toHaveBeenCalled();
        });
    });

    // More tests here for fetchUsers, deleteUser, etc.
});
