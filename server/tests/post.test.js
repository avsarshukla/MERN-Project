const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Post = require('../models/Post');

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
    console.log('STARTING MEMBER 2 POST MANAGEMENT TESTS');
    console.log('========================================\n');

    // Setup in-memory MongoDB
    console.log('[Test Setup] Starting MongoMemoryServer for Post tests...');
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('[Test Setup] Connected to in-memory MongoDB\n');

    // 1. Create test users: User A, User B, Admin
    const userARes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Author',
        email: 'alice@example.com',
        password: 'password123'
      });
    const tokenA = userARes.body.data.token;
    const userAId = userARes.body.data.user._id;

    const userBRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bob Reader',
        email: 'bob@example.com',
        password: 'password123'
      });
    const tokenB = userBRes.body.data.token;
    const userBId = userBRes.body.data.user._id;

    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Admin Boss',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin'
      });
    const tokenAdmin = adminRes.body.data.token;

    console.log('Setup: Created test users (Alice, Bob, Admin)');

    // 2. Create Post with valid data
    console.log('\nTest 1: Create Post with valid data');
    const postPayload = {
      title: 'First MERN Blog Post',
      content: 'This is the detailed content for the first post on the MERN system.',
      category: 'Technology',
      image: 'https://images.unsplash.com/photo-1'
    };

    const createRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(postPayload);

    assert(createRes.status === 201, 'POST /api/posts returns 201 Created');
    assert(createRes.body.success === true, 'Response success is true');
    assert(createRes.body.data.post.title === 'First MERN Blog Post', 'Created post has correct title');
    assert(createRes.body.data.post.category === 'Technology', 'Created post has correct category');
    assert(createRes.body.data.post.author._id.toString() === userAId.toString(), 'Author matches authenticated user');
    assert(createRes.body.data.post.author.name === 'Alice Author', 'Author name is populated');
    assert(createRes.body.data.post.author.password === undefined, 'Author password is not exposed');
    const firstPostId = createRes.body.data.post._id;

    // 3. Security: Author spoofing prevention
    console.log('\nTest 2: Author spoofing prevention');
    const spoofRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Spoofed Post Attempt',
        content: 'Trying to pretend to be Bob while authenticated as Alice.',
        author: userBId // Trying to spoof Bob's ID
      });

    assert(spoofRes.status === 201, 'Post creation succeeds');
    assert(spoofRes.body.data.post.author._id.toString() === userAId.toString(), 'Post author is Alice, ignoring spoofed client author');

    // 4. Reject unauthenticated post creation
    console.log('\nTest 3: Reject unauthenticated post creation');
    const unauthCreateRes = await request(app)
      .post('/api/posts')
      .send({
        title: 'Unauthenticated Post',
        content: 'This post should not be saved.'
      });
    assert(unauthCreateRes.status === 401, 'Unauthenticated post creation returns 401 Unauthorized');

    // 5. Reject post with invalid data (missing title, content, or too short)
    console.log('\nTest 4: Post input validation');
    const missingTitleRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'Content without title' });
    assert(missingTitleRes.status === 400, 'Missing title returns 400 Bad Request');

    const missingContentRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Title without content' });
    assert(missingContentRes.status === 400, 'Missing content returns 400 Bad Request');

    const shortTitleRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Hi', content: 'Valid long content here' });
    assert(shortTitleRes.status === 400, 'Short title returns 400 Bad Request');

    // 6. Create post by Bob for multi-user tests
    const bobPostRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        title: 'Bob Lifestyle Thoughts',
        content: 'Sharing thoughts on daily habits and productive work.',
        category: 'Lifestyle'
      });
    const bobPostId = bobPostRes.body.data.post._id;

    // 7. Get all posts (Paginated)
    console.log('\nTest 5: Retrieve paginated posts (Public GET /api/posts)');
    const getAllRes = await request(app).get('/api/posts');
    assert(getAllRes.status === 200, 'GET /api/posts returns 200 OK');
    assert(getAllRes.body.success === true, 'Response success is true');
    assert(Array.isArray(getAllRes.body.data), 'Returns an array of posts');
    assert(getAllRes.body.total >= 3, 'Total posts count is tracked correctly');
    assert(getAllRes.body.page === 1, 'Default page is 1');
    assert(getAllRes.body.totalPages >= 1, 'totalPages is calculated');

    // 8. Get single post by ID (Public GET /api/posts/:id)
    console.log('\nTest 6: Retrieve single post by ID');
    const getSingleRes = await request(app).get(`/api/posts/${firstPostId}`);
    assert(getSingleRes.status === 200, 'GET /api/posts/:id returns 200 OK');
    assert(getSingleRes.body.data.post.title === 'First MERN Blog Post', 'Correct post retrieved');
    assert(getSingleRes.body.data.post.author.name === 'Alice Author', 'Author details populated');

    // 9. Error handling: Invalid ObjectId and Non-existent post
    console.log('\nTest 7: Error handling for invalid and non-existent IDs');
    const invalidIdRes = await request(app).get('/api/posts/not-a-valid-object-id');
    assert(invalidIdRes.status === 400, 'Invalid ObjectId format returns 400 Bad Request');

    const fakeId = new mongoose.Types.ObjectId();
    const notFoundRes = await request(app).get(`/api/posts/${fakeId}`);
    assert(notFoundRes.status === 404, 'Non-existent post returns 404 Not Found');

    // 10. Get authenticated user's own posts (/api/posts/my and /api/posts/my-posts)
    console.log('\nTest 8: Retrieve authenticated user own posts');
    const myPostsRes1 = await request(app)
      .get('/api/posts/my')
      .set('Authorization', `Bearer ${tokenA}`);
    assert(myPostsRes1.status === 200, 'GET /api/posts/my returns 200 OK');
    assert(myPostsRes1.body.data.length === 2, "Alice receives only Alice's 2 posts");
    assert(
      myPostsRes1.body.data.every((p) => p.author._id.toString() === userAId.toString()),
      'All retrieved posts belong to Alice'
    );

    const myPostsRes2 = await request(app)
      .get('/api/posts/my-posts')
      .set('Authorization', `Bearer ${tokenB}`);
    assert(myPostsRes2.status === 200, 'GET /api/posts/my-posts alias returns 200 OK');
    assert(myPostsRes2.body.data.length === 1, "Bob receives only Bob's 1 post");

    // 11. Search posts
    console.log('\nTest 9: Search posts by keyword');
    const searchRes = await request(app).get('/api/posts?search=lifestyle');
    assert(searchRes.status === 200, 'Search query returns 200 OK');
    assert(searchRes.body.data.length === 1, 'Search finds matching post');
    assert(searchRes.body.data[0].title === 'Bob Lifestyle Thoughts', 'Correct post matched by search');

    // 12. Filter posts by category
    console.log('\nTest 10: Filter posts by category');
    const categoryRes = await request(app).get('/api/posts?category=Technology');
    assert(categoryRes.status === 200, 'Category filter returns 200 OK');
    assert(categoryRes.body.data.length >= 1, 'Finds posts with category Technology');
    assert(
      categoryRes.body.data.every((p) => p.category.toLowerCase() === 'technology'),
      'All filtered posts match Technology'
    );

    // 13. Update post by owner
    console.log('\nTest 11: Update post by owner');
    const updateRes = await request(app)
      .put(`/api/posts/${firstPostId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Updated First MERN Blog Post',
        content: 'Updated content with even more helpful information.'
      });
    assert(updateRes.status === 200, 'PUT /api/posts/:id returns 200 OK');
    assert(updateRes.body.data.post.title === 'Updated First MERN Blog Post', 'Title updated in response');

    const dbPostAfterUpdate = await Post.findById(firstPostId);
    assert(dbPostAfterUpdate.title === 'Updated First MERN Blog Post', 'Title updated in database');

    // 14. Prevent non-owner from updating post
    console.log('\nTest 12: Prevent unauthorized user from updating another user post');
    const unauthorizedUpdateRes = await request(app)
      .put(`/api/posts/${firstPostId}`)
      .set('Authorization', `Bearer ${tokenB}`) // Bob trying to update Alice's post
      .send({
        title: 'Hacked by Bob'
      });
    assert(unauthorizedUpdateRes.status === 403, 'Unauthorized update returns 403 Forbidden');

    // 15. Prevent unauthenticated user from updating post
    console.log('\nTest 13: Prevent unauthenticated post update');
    const unauthUpdateRes = await request(app)
      .put(`/api/posts/${firstPostId}`)
      .send({ title: 'Hacked anonymously' });
    assert(unauthUpdateRes.status === 401, 'Unauthenticated update returns 401 Unauthorized');

    // 16. Admin can update any post
    console.log('\nTest 14: Admin can update any post');
    const adminUpdateRes = await request(app)
      .put(`/api/posts/${firstPostId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ title: 'Moderated by Admin' });
    assert(adminUpdateRes.status === 200, 'Admin can successfully update post (200 OK)');
    assert(adminUpdateRes.body.data.post.title === 'Moderated by Admin', 'Post title reflects admin update');

    // 17. Prevent non-owner from deleting post
    console.log('\nTest 15: Prevent unauthorized user from deleting another user post');
    const unauthorizedDeleteRes = await request(app)
      .delete(`/api/posts/${firstPostId}`)
      .set('Authorization', `Bearer ${tokenB}`); // Bob trying to delete Alice's post
    assert(unauthorizedDeleteRes.status === 403, 'Unauthorized delete returns 403 Forbidden');

    // 18. Prevent unauthenticated user from deleting post
    console.log('\nTest 16: Prevent unauthenticated post delete');
    const unauthDeleteRes = await request(app).delete(`/api/posts/${firstPostId}`);
    assert(unauthDeleteRes.status === 401, 'Unauthenticated delete returns 401 Unauthorized');

    // 19. Delete post by owner
    console.log('\nTest 17: Delete post by owner');
    const deleteRes = await request(app)
      .delete(`/api/posts/${firstPostId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    assert(deleteRes.status === 200, 'DELETE /api/posts/:id returns 200 OK');

    const dbPostAfterDelete = await Post.findById(firstPostId);
    assert(dbPostAfterDelete === null, 'Post removed from database');

    // 20. Admin can delete any post
    console.log('\nTest 18: Admin can delete any post');
    const adminDeleteRes = await request(app)
      .delete(`/api/posts/${bobPostId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);
    assert(adminDeleteRes.status === 200, 'Admin can delete any post (200 OK)');

    const dbBobPostAfterDelete = await Post.findById(bobPostId);
    assert(dbBobPostAfterDelete === null, "Bob's post removed by Admin");

    // 21. Delete non-existent post returns 404
    console.log('\nTest 19: Delete non-existent post returns 404');
    const deleteFakeRes = await request(app)
      .delete(`/api/posts/${fakeId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    assert(deleteFakeRes.status === 404, 'Deleting non-existent post returns 404');

    console.log('\n========================================');
    console.log(`MEMBER 2 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================\n');

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Member 2 test execution error:', err);
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

