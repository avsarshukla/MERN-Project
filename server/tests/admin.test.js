const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

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
    console.log('\n======================================================');
    console.log('STARTING MEMBER 4 DASHBOARD & ADMIN AUTOMATED TESTS');
    console.log('======================================================\n');

    // Setup in-memory MongoDB
    console.log('[Test Setup] Starting MongoMemoryServer for Member 4 tests...');
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('[Test Setup] Connected to in-memory MongoDB\n');

    // 1. Create Users: Admin, Regular User A, Regular User B
    const adminUser = await User.create({
      name: 'Super Administrator',
      email: 'admin@system.com',
      password: 'password123',
      role: 'admin'
    });

    const userARes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Member',
        email: 'alice.member@example.com',
        password: 'password123'
      });
    const tokenA = userARes.body.data.token;
    const userAId = userARes.body.data.user._id;

    const userBRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bob Member',
        email: 'bob.member@example.com',
        password: 'password123'
      });
    const tokenB = userBRes.body.data.token;
    const userBId = userBRes.body.data.user._id;

    // Login admin to obtain token
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@system.com',
        password: 'password123'
      });
    const tokenAdmin = adminLoginRes.body.data.token;
    const adminId = adminLoginRes.body.data.user._id;

    // --- PART A: USER DASHBOARD TESTS ---
    console.log('\n--- PART A: USER DASHBOARD TESTS ---');

    // Test 1: User with no posts dashboard
    console.log('\nTest 1: User with no posts accesses dashboard');
    const emptyDashRes = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${tokenA}`);

    assert(emptyDashRes.status === 200, 'GET /api/dashboard/stats returns 200 OK');
    assert(emptyDashRes.body.success === true, 'Response success is true');
    assert(emptyDashRes.body.data.stats.userPostsCount === 0, 'Initial user posts count is 0');
    assert(emptyDashRes.body.data.stats.totalLikesReceived === 0, 'Initial likes received is 0');
    assert(emptyDashRes.body.data.stats.userCommentsCount === 0, 'Initial user comments written is 0');
    assert(emptyDashRes.body.data.stats.totalCommentsReceived === 0, 'Initial comments received is 0');
    assert(emptyDashRes.body.data.stats.globalUsersCount === 3, 'Global users count is 3');

    // Test 2: Reject unauthenticated dashboard request
    console.log('\nTest 2: Reject unauthenticated dashboard request');
    const unauthDashRes = await request(app).get('/api/dashboard/stats');
    assert(unauthDashRes.status === 401, 'Unauthenticated dashboard request returns 401');

    // Create posts and interactions for Alice
    const post1 = await Post.create({
      title: 'Alice Post One',
      content: 'Content for Alice post one',
      category: 'Technology',
      author: userAId,
      likes: [userBId, adminId] // 2 likes
    });

    const post2 = await Post.create({
      title: 'Alice Post Two',
      content: 'Content for Alice post two',
      category: 'Lifestyle',
      author: userAId,
      likes: [userBId] // 1 like
    });

    // Bob creates a post
    const bobPost = await Post.create({
      title: 'Bob First Post',
      content: 'Content for Bob post',
      category: 'Education',
      author: userBId,
      likes: []
    });

    // Add comments
    await Comment.create({
      content: 'Bob comments on Alice post 1',
      author: userBId,
      post: post1._id
    });
    await Comment.create({
      content: 'Admin comments on Alice post 1',
      author: adminId,
      post: post1._id
    });
    await Comment.create({
      content: 'Alice comments on Bob post',
      author: userAId,
      post: bobPost._id
    });

    // Test 3: Dashboard counts match populated database data
    console.log('\nTest 3: Populated user dashboard metrics match DB');
    const populatedDashRes = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${tokenA}`);

    assert(populatedDashRes.status === 200, 'Populated dashboard returns 200 OK');
    const statsA = populatedDashRes.body.data.stats;
    assert(statsA.userPostsCount === 2, 'Alice has 2 authored posts');
    assert(statsA.totalLikesReceived === 3, 'Alice received 3 total likes (2 on post1 + 1 on post2)');
    assert(statsA.userCommentsCount === 1, 'Alice authored 1 comment');
    assert(statsA.totalCommentsReceived === 2, 'Alice received 2 comments on her posts');
    assert(statsA.globalPostsCount === 3, 'Total 3 posts in database');
    assert(populatedDashRes.body.data.recentPosts.length === 2, 'Returns recent posts array');
    assert(populatedDashRes.body.data.recentComments.length === 1, 'Returns recent comments array with populated post title');
    assert(populatedDashRes.body.data.recentComments[0].post.title === 'Bob First Post', 'Comment references correct post title');

    // --- PART B: ADMIN AUTHORIZATION & CONTROLS ---
    console.log('\n--- PART B: ADMIN AUTHORIZATION & ACCESS CONTROLS ---');

    // Test 4: Regular user denied access to admin endpoints
    console.log('\nTest 4: Regular user rejected from admin endpoints (403)');
    const regularUserAdminStats = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${tokenA}`);
    assert(regularUserAdminStats.status === 403, 'Regular user GET /api/admin/stats returns 403 Forbidden');

    const regularUserGetUsers = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${tokenA}`);
    assert(regularUserGetUsers.status === 403, 'Regular user GET /api/admin/users returns 403 Forbidden');

    const regularUserDeletePost = await request(app)
      .delete(`/api/admin/posts/${post1._id}`)
      .set('Authorization', `Bearer ${tokenA}`);
    assert(regularUserDeletePost.status === 403, 'Regular user DELETE /api/admin/posts/:id returns 403 Forbidden');

    // Test 5: Unauthenticated access to admin endpoints rejected (401)
    console.log('\nTest 5: Unauthenticated user rejected from admin endpoints (401)');
    const unauthAdminRes = await request(app).get('/api/admin/stats');
    assert(unauthAdminRes.status === 401, 'Unauthenticated GET /api/admin/stats returns 401 Unauthorized');

    // Test 6: Admin retrieves platform-wide statistics
    console.log('\nTest 6: Admin retrieves platform-wide statistics');
    const adminStatsRes = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    assert(adminStatsRes.status === 200, 'GET /api/admin/stats returns 200 OK');
    const adminStats = adminStatsRes.body.data.stats;
    assert(adminStats.totalUsers === 3, 'Total users is 3');
    assert(adminStats.totalPosts === 3, 'Total posts is 3');
    assert(adminStats.totalComments === 3, 'Total comments is 3');
    assert(adminStats.totalLikes === 3, 'Total likes is 3');
    assert(adminStats.adminCount === 1, 'Admin count is 1');
    assert(adminStats.regularUserCount === 2, 'Regular user count is 2');
    assert(Array.isArray(adminStatsRes.body.data.categoriesCount), 'Categories breakdown returned');
    assert(adminStatsRes.body.data.recentPosts.length === 3, 'Recent posts list returned');
    assert(adminStatsRes.body.data.recentUsers.length === 3, 'Recent users list returned');

    // Test 7: Admin lists users with pagination and search
    console.log('\nTest 7: Admin lists all users');
    const adminUsersRes = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    assert(adminUsersRes.status === 200, 'GET /api/admin/users returns 200 OK');
    assert(adminUsersRes.body.total === 3, 'Admin user list total is 3');
    assert(adminUsersRes.body.data.every((u) => u.password === undefined), 'Password hashes are excluded');

    const searchUserRes = await request(app)
      .get('/api/admin/users?search=Alice')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    assert(searchUserRes.body.data.length === 1, 'Search finds 1 user matching Alice');
    assert(searchUserRes.body.data[0].email === 'alice.member@example.com', 'Matches Alice email');

    // Test 8: Admin updates user role
    console.log('\nTest 8: Admin updates user role');
    const promoteRes = await request(app)
      .patch(`/api/admin/users/${userBId}/role`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ role: 'admin' });

    assert(promoteRes.status === 200, 'PATCH /api/admin/users/:id/role returns 200 OK');
    assert(promoteRes.body.data.user.role === 'admin', 'Bob is promoted to admin');

    const dbBob = await User.findById(userBId);
    assert(dbBob.role === 'admin', 'Bob role updated to admin in database');

    // Test 9: Admin cannot revoke their own admin privileges
    console.log('\nTest 9: Admin cannot revoke own admin privileges');
    const selfDemoteRes = await request(app)
      .patch(`/api/admin/users/${adminId}/role`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ role: 'user' });

    assert(selfDemoteRes.status === 400, 'Self-demotion returns 400 Bad Request');
    assert(selfDemoteRes.body.success === false, 'Self-demotion rejected');

    // Demote Bob back to user
    await request(app)
      .patch(`/api/admin/users/${userBId}/role`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ role: 'user' });

    // Test 10: Admin cannot delete their own account
    console.log('\nTest 10: Admin cannot delete their own account');
    const selfDeleteRes = await request(app)
      .delete(`/api/admin/users/${adminId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    assert(selfDeleteRes.status === 400, 'Self-deletion returns 400 Bad Request');

    // Test 11: Admin lists all posts
    console.log('\nTest 11: Admin lists all posts');
    const adminPostsRes = await request(app)
      .get('/api/admin/posts')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    assert(adminPostsRes.status === 200, 'GET /api/admin/posts returns 200 OK');
    assert(adminPostsRes.body.total === 3, 'Total posts listed for admin is 3');

    // Test 12: Admin moderates/deletes a post
    console.log('\nTest 12: Admin moderates/deletes a post');
    const deletePostRes = await request(app)
      .delete(`/api/admin/posts/${post2._id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    assert(deletePostRes.status === 200, 'DELETE /api/admin/posts/:id returns 200 OK');
    const dbPost2After = await Post.findById(post2._id);
    assert(dbPost2After === null, 'Post 2 removed from database');

    // Test 13: Admin lists and moderates comments
    console.log('\nTest 13: Admin lists and deletes comments');
    const adminCommentsRes = await request(app)
      .get('/api/admin/comments')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    assert(adminCommentsRes.status === 200, 'GET /api/admin/comments returns 200 OK');
    const commentToDelete = adminCommentsRes.body.data[0];

    const deleteCommentRes = await request(app)
      .delete(`/api/admin/comments/${commentToDelete._id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    assert(deleteCommentRes.status === 200, 'DELETE /api/admin/comments/:id returns 200 OK');
    const dbCommentAfter = await Comment.findById(commentToDelete._id);
    assert(dbCommentAfter === null, 'Comment removed from database');

    // Test 14: Admin deletes user with cascade deletion
    console.log('\nTest 14: Admin deletes user with cascade cleanup');
    const deleteUserRes = await request(app)
      .delete(`/api/admin/users/${userAId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    assert(deleteUserRes.status === 200, 'Admin DELETE /api/admin/users/:id returns 200 OK');

    const [dbUserA, dbAlicePosts, dbAliceComments] = await Promise.all([
      User.findById(userAId),
      Post.find({ author: userAId }),
      Comment.find({ author: userAId })
    ]);

    assert(dbUserA === null, 'Alice user record deleted');
    assert(dbAlicePosts.length === 0, 'All of Alice posts deleted');
    assert(dbAliceComments.length === 0, 'All of Alice comments deleted');

    // Verify Bob's post no longer has Alice in likes
    const dbBobPostAfter = await Post.findById(bobPost._id);
    assert(
      !dbBobPostAfter.likes.some((id) => id.toString() === userAId.toString()),
      'Alice like references purged from remaining posts'
    );

    // Test 15: Error handling for invalid IDs and non-existent resources
    console.log('\nTest 15: Error handling for invalid IDs and 404s');
    const invalidIdRes = await request(app)
      .delete('/api/admin/users/invalid-id')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    assert(invalidIdRes.status === 400, 'Invalid user ID returns 400');

    const fakeId = new mongoose.Types.ObjectId();
    const notFoundUserRes = await request(app)
      .delete(`/api/admin/users/${fakeId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);
    assert(notFoundUserRes.status === 404, 'Non-existent user returns 404');

    const notFoundPostRes = await request(app)
      .delete(`/api/admin/posts/${fakeId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);
    assert(notFoundPostRes.status === 404, 'Non-existent post returns 404');

    console.log('\n======================================================');
    console.log(`MEMBER 4 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Member 4 test execution error:', err);
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
