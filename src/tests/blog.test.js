import request from 'supertest';
import app from '../server.js';
import mongoose from 'mongoose';

// Mock blog data for testing
const blogData = {
  title: "Test Blog",
  image: "image.png",
  content: "Test Content",
  // add author id here
};

beforeAll(async () => {
  const url = "mongodb+srv://nijohn0006:holdon0006@cluster0.ftqoc5o.mongodb.net/bookmarks_db";
  await mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  // Close the DB connection after the tests have completed
  await mongoose.connection.close();
});

describe('Blog Endpoints', () => {
  let newlyCreatedBlog;

  // Test for POST /api/blog/create
  it('should create a new blog', async () => {
    const res = await request(app)
      .post('/api/blog/create')
      // You'd need to log in here and place the JWT token in the header
      .set('Authorization', 'Bearer token')
      .send(blogData);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('blog');
    newlyCreatedBlog = res.body.blog;
  });

  // Test for GET /api/blog
  it('should get all blogs', async () => {
    const res = await request(app)
      .get('/api/blog')
      .send();
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('totalPages');
    expect(res.body).toHaveProperty('blogs');
  });

  // Test for GET /api/blog/:id
  it('should get a blog by id', async () => {
    const res = await request(app)
      .get(`/api/blog/${newlyCreatedBlog._id}`)
      .send();
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('_id', newlyCreatedBlog._id);
  });
});

// Test for PUT /api/blog/update/:id
it('should update an existing blog', async () => {
  const res = await request(app)
    .put(`/api/blog/update/${newlyCreatedBlog._id}`)
    // Add your token here
    .set('Authorization', 'Bearer token')
    .send({ title: 'New blog title' });
  expect(res.statusCode).toEqual(200);
  expect(res.body.title).toEqual('New blog title');
});

// Test for DELETE /api/blog/delete/:id
it('should delete an existing blog', async () => {
  const res = await request(app)
    .delete(`/api/blog/delete/${newlyCreatedBlog._id}`)
    // Add your token here
    .set('Authorization', 'Bearer token')
    .send();
  expect(res.statusCode).toEqual(200);
  expect(res.body.message).toEqual('Blog deleted successfully.');
});

// Test for GET /api/blog/:id for a non-existent blog
it('should return 404 for a non-existent blog', async () => {
  const res = await request(app)
    .get(`/api/blog/60f5a88d12b25c34e4933554`);  // this id should not exist in your database
  expect(res.statusCode).toEqual(404);
});

// Test for PUT /api/blog/update/:id for a non-existent blog
it('should return 404 when updating a non-existent blog', async () => {
  const res = await request(app)
    .put(`/api/blog/update/60f5a88d12b25c34e4933554`) // this id should not exist in your database
    // Add your token here
    .set('Authorization', 'Bearer token')
    .send();
  expect(res.statusCode).toEqual(404);
});

// Test case for POST /api/blog/create with missing blog details
it('should not create a new blog with missing details', async () => {
  const res = await request(app)
    .post('/api/blog/create')
    .set('Authorization', 'Bearer token')
    .send({ image: 'image.png', content: 'Test Content' }); // Missing title here
  expect(res.statusCode).toEqual(400); // A bad request
});

// Test case for unauthorized access to DELETE /api/blog/delete/:id
it('should not delete a blog without authorization', async () => {
  const res = await request(app)
    .delete(`/api/blog/delete/${newlyCreatedBlog._id}`)
    // Missing Authorization header here
    .send();
  expect(res.statusCode).toEqual(401); // Unauthorized
});

// Test case for unauthorized access to PUT /api/blog/update/:id
it('should not update a blog without authorization', async () => {
  const res = await request(app)
    .put(`/api/blog/update/${newlyCreatedBlog._id}`)
    // Missing Authorization header here
    .send({ title: 'New blog title' });
  expect(res.statusCode).toEqual(401); // Unauthorized
});

describe('Blog Posts', () => {
  let authToken;

  beforeAll(async () => {
    // Register and login a user first to get the auth token
    const userData = {
      name: 'Test User',
      email: 'testuser@gmail.com',
      password: 'TestPassword123'
    };

    let response = await request(app)
      .post('/api/users/register')
      .send(userData);

    response = await request(app)
      .post('/api/users/login')
      .send({
        email: userData.email,
        password: userData.password,
      });

    authToken = response.body.token;
  });

  // Test case for POST /api/blog with correct data
  it('should create a blog post', async () => {
    const blogPost = {
      title: 'Test Post',
      content: 'This is a test post.',
    };

    const res = await request(app)
      .post('/api/blog')
      .set('Authorization', `Bearer ${authToken}`)
      .send(blogPost);

    expect(res.statusCode).toEqual(201); // Created
    expect(res.body).toHaveProperty('title', blogPost.title);
    expect(res.body).toHaveProperty('content', blogPost.content);
  });

  // Test case for GET /api/blog 
  it('should get all blog posts', async () => {
    const res = await request(app)
      .get('/api/blog');

    expect(res.statusCode).toEqual(200); // OK
    expect(res.body).toBeInstanceOf(Array);
  });

});

describe('Blog Posts Update and Delete', () => {
  let authToken, testPost;

  beforeAll(async () => {
    // Register a new user
    const userData = {
      name: 'Test User',
      email: 'testuser@gmail.com',
      password: 'TestPassword123'
    };

    let response = await request(app)
      .post('/api/users/register')
      .send(userData);

    // Log the user in
    response = await request(app)
      .post('/api/users/login')
      .send({
        email: userData.email,
        password: userData.password,
      });

    authToken = response.body.token;

    // Create a blog post
    const blogPost = {
      title: 'Test Post',
      content: 'This is a test post.',
    };

    response = await request(app)
      .post('/api/blog')
      .set('Authorization', `Bearer ${authToken}`)
      .send(blogPost);

    testPost = response.body;
  });

  // Test case for PUT /api/blog/:id with correct details
  it('should update the blog post', async () => {
    const response = await request(app)
      .put(`/api/blog/${testPost.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Updated Test Post',
        content: 'This is an updated test post.',
      });

    expect(response.statusCode).toEqual(200); // OK
    expect(response.body).toHaveProperty('title', 'Updated Test Post');
    expect(response.body).toHaveProperty('content', 'This is an updated test post.');
  });

  // Test case for DELETE /api/blog/:id with authorization
  it('should delete the blog post if authorized', async () => {
    const response = await request(app)
      .delete(`/api/blog/${testPost.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.statusCode).toEqual(200); // OK
  });

  // Test case for DELETE /api/blog/:id without authorization
  it('should not delete the blog post if not authorized', async () => {
    const response = await request(app)
      .delete(`/api/blog/${testPost.id}`);

    expect(response.statusCode).toEqual(401); // Unauthorized
  });
});

describe('Blog Post Error Conditions', () => {
  let authToken, secondUserToken;

  beforeAll(async () => {
    // Register and login two different users to get their auth tokens
    let response = await request(app)
      .post('/api/users/register')
      .send({
        name: 'Test User',
        email: 'testuser@gmail.com',
        password: 'TestPassword123',
      });

    response = await request(app)
      .post('/api/users/login')
      .send({
        email: 'testuser@gmail.com',
        password: 'TestPassword123',
      });

    authToken = response.body.token;

    response = await request(app)
      .post('/api/users/register')
      .send({
        name: 'Second User',
        email: 'seconduser@gmail.com',
        password: 'TestPassword123',
      });

    response = await request(app)
      .post('/api/users/login')
      .send({
        email: 'seconduser@gmail.com',
        password: 'TestPassword123',
      });

    secondUserToken = response.body.token;
  });

  // Test case for PUT /api/blog/:id with non-existent id
  it('should return status code 404 when trying to update a non-existent post', async () => {
    const response = await request(app)
      .put('/api/blog/99999')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Updated Test Post',
        content: 'This is an updated test post.',
      });

    expect(response.statusCode).toEqual(404);
  });

  // Test case for DELETE /api/blog/:id with non-existent id
  it('should return status code 404 when trying to delete a non-existent post', async () => {
    const response = await request(app)
      .delete('/api/blog/99999')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.statusCode).toEqual(404);
  });

  // Test case for PUT /api/blog/:id by a non-author user
  it('should return status code 403 giving a non-author user tries to update the post', async () => {
    const initialPost = {
      title: 'Another Test Post',
      content: 'Content of the test post.',
    };

    let response = await request(app)
      .post('/api/blog')
      .set('Authorization', `Bearer ${authToken}`)
      .send(initialPost);

    response = await request(app)
      .put(`/api/blog/${response.body.id}`)
      .set('Authorization', `Bearer ${secondUserToken}`)
      .send({
        title: 'Updated Test Post 2',
        content: 'Updated content of the test post.',
      });

    expect(response.statusCode).toEqual(403);
  });

  // Test case for DELETE /api/blog/:id by a non-author user
  it('should return status code 403 giving a non-author user tries to delete the post', async () => {
    const initialPost = {
      title: 'Yet Another Test Post',
      content: 'Content of yet another test post.',
    };

    let response = await request(app)
      .post('/api/blog')
      .set('Authorization', `Bearer ${authToken}`)
      .send(initialPost);

    response = await request(app)
      .delete(`/api/blog/${response.body.id}`)
      .set('Authorization', `Bearer ${secondUserToken}`);

    expect(response.statusCode).toEqual(403);
  });
});
