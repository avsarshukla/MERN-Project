const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

let mongoServer;

const runTests = async () => {
  let passed = 0;
  let failed = 0;

  const assert = (condition, description) => {
    if (condition) {
      console.log(`  ✓ PASS: ${description}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${description}`);
      failed++;
    }
  };

  try {
    console.log('\n========================================');
    console.log('STARTING MEMBER 1 AUTHENTICATION TESTS');
    console.log('========================================\n');

    // Setup in-memory MongoDB
    console.log('[Test Setup] Starting MongoMemoryServer...');
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('[Test Setup] Connected to in-memory MongoDB\n');

    // 1. Health check
    console.log('Test 1: Health check endpoint');
    const healthRes = await request(app).get('/api/health');
    assert(healthRes.status === 200, 'GET /api/health returns 200');
    assert(healthRes.body.status === 'OK', 'Health check status is OK');

    // 2. Successful Registration
    console.log('\nTest 2: User Registration');
    const registerPayload = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    };
    const regRes = await request(app)
      .post('/api/auth/register')
      .send(registerPayload);

    assert(regRes.status === 201, 'POST /api/auth/register returns 201 Created');
    assert(regRes.body.success === true, 'Response success is true');
    assert(regRes.body.data && regRes.body.data.token, 'Response contains JWT token');
    assert(regRes.body.data.user.email === 'john@example.com', 'Registered email matches');
    assert(regRes.body.data.user.name === 'John Doe', 'Registered name matches');
    assert(regRes.body.data.user.role === 'user', 'Default role is user');
    assert(regRes.body.data.user.password === undefined, 'Plaintext/hashed password is not exposed in response');

    // 3. Password Hashing Verification in Database
    console.log('\nTest 3: Password Hashing Verification in DB');
    const dbUser = await User.findOne({ email: 'john@example.com' });
    assert(dbUser !== null, 'User exists in MongoDB');
    assert(dbUser.password !== 'password123', 'Password is not stored in plaintext');
    assert(dbUser.password.startsWith('$2'), 'Password is hashed with bcrypt');

    // 4. Duplicate Email Rejection
    console.log('\nTest 4: Duplicate Email Rejection');
    const dupRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Another John',
        email: 'JOHN@EXAMPLE.COM', // Test case-insensitive normalization
        password: 'anotherpassword'
      });
    assert(dupRes.status === 400, 'Duplicate email returns 400 Bad Request');
    assert(dupRes.body.success === false, 'Duplicate registration success is false');

    // 5. Validation Rejection (Short password / Missing fields)
    console.log('\nTest 5: Validation for Missing Fields / Short Password');
    const invalidRes1 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob', password: 'password123' }); // Missing email
    assert(invalidRes1.status === 400, 'Missing email returns 400');

    const invalidRes2 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob', email: 'bob@example.com', password: '123' }); // Short password
    assert(invalidRes2.status === 400, 'Short password returns 400');

    // 6. Successful Login
    console.log('\nTest 6: User Login');
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'john@example.com',
        password: 'password123'
      });
    assert(loginRes.status === 200, 'POST /api/auth/login returns 200 OK');
    assert(loginRes.body.success === true, 'Login success is true');
    assert(loginRes.body.data && loginRes.body.data.token, 'Login returns JWT token');
    const authToken = loginRes.body.data.token;

    // 7. Login with Incorrect Password
    console.log('\nTest 7: Login with Incorrect Password');
    const wrongPassRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'john@example.com',
        password: 'wrongpassword'
      });
    assert(wrongPassRes.status === 401, 'Wrong password returns 401 Unauthorized');
    assert(wrongPassRes.body.success === false, 'Wrong password success is false');

    // 8. Login with Non-Existent User
    console.log('\nTest 8: Login with Non-Existent User');
    const unknownUserRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'password123'
      });
    assert(unknownUserRes.status === 401, 'Non-existent user returns 401 Unauthorized');

    // 9. Protected Route Rejection without Token
    console.log('\nTest 9: Protected Route Rejection without Token');
    const noTokenRes = await request(app).get('/api/auth/me');
    assert(noTokenRes.status === 401, 'GET /api/auth/me without token returns 401');

    // 10. Protected Route Rejection with Malformed/Invalid Token
    console.log('\nTest 10: Protected Route Rejection with Invalid Token');
    const badTokenRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.value');
    assert(badTokenRes.status === 401, 'Invalid token returns 401');

    // 11. Protected Current User Retrieval (GET /api/auth/me)
    console.log('\nTest 11: GET /api/auth/me with Valid Token');
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);
    assert(meRes.status === 200, 'GET /api/auth/me returns 200 OK');
    assert(meRes.body.data.user.name === 'John Doe', 'Returns current user name');
    assert(meRes.body.data.user.email === 'john@example.com', 'Returns current user email');
    assert(meRes.body.data.user.password === undefined, 'Password is omitted');

    // 12. Profile Retrieval (GET /api/users/profile)
    console.log('\nTest 12: GET /api/users/profile');
    const profileRes = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${authToken}`);
    assert(profileRes.status === 200, 'GET /api/users/profile returns 200 OK');
    assert(profileRes.body.data.user.email === 'john@example.com', 'Profile matches authenticated user');

    // 13. Profile Update (PUT /api/users/profile)
    console.log('\nTest 13: PUT /api/users/profile');
    const updateRes = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'John Updated',
        profileImage: 'https://example.com/avatar.png'
      });
    assert(updateRes.status === 200, 'PUT /api/users/profile returns 200 OK');
    assert(updateRes.body.data.user.name === 'John Updated', 'User name updated to John Updated');
    assert(updateRes.body.data.user.profileImage === 'https://example.com/avatar.png', 'Profile image updated');

    // 14. Admin role support
    console.log('\nTest 14: Role support (User and Admin)');
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'adminpassword123',
      role: 'admin'
    });
    assert(adminUser.role === 'admin', 'Admin user created with role "admin"');

    console.log('\n========================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================\n');

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
};

runTests();
