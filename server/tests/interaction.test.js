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
    console.log('STARTING MEMBER 3 LIKES & COMMENTS INTERACTION TESTS');
    console.log('======================================================\n');

    // Setup in-memory MongoDB
    console.log('[Test Setup] Starting MongoMemoryServer for Interaction tests...');
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('[Test Setup] Connected to in-memory MongoDB\n');

    // 1. Create test users: User A (Author), User B (Commenter/Liker), Admin
    const userARes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice PostOwner',
        email: 'alice.owner@example.com',
        password: 'password123'
      });
    const tokenA = userARes.body.data.token;
    const userAId = userARes.body.data.user._id;

    const userBRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bob Interactor',
        email: 'bob.interactor@example.com',
        password: 'password123'
      });
    const tokenB = userBRes.body.data.token;
    const userBId = userBRes.body.data.user._id;

    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Admin Moderator',
        email: 'admin.moderator@example.com',
        password: 'password123',
        role: 'admin'
      });
    const tokenAdmin = adminRes.body.data.token;

    // Create a test post by Alice
    const postRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Community Interaction Post',
        content: 'This post is used to test likes, unlikes, and comment threads.',
        category: 'Technology'
      });
    const postId = postRes.body.data.post._id;

    // --- PART A: LIKES & UNLIKES ---
    console.log('\n--- PART A: LIKES & UNLIKES ---');

    // Test 1: Authenticated like
    console.log('\nTest 1: Authenticated user likes a post');
    const likeRes1 = await request(app)
      .post(`/api/posts/${postId}/like`)
      .set('Authorization', `Bearer ${tokenB}`);

    assert(likeRes1.status === 200, 'POST /api/posts/:id/like returns 200 OK');
    assert(likeRes1.body.success === true, 'Response success is true');
    assert(likeRes1.body.data.likesCount === 1, 'Like count increments to 1');
    assert(likeRes1.body.data.isLiked === true, 'isLiked is true');

    const dbPost1 = await Post.findById(postId);
    assert(dbPost1.likes.length === 1, 'Post document has 1 like in DB');
    assert(dbPost1.likes[0].toString() === userBId.toString(), 'Liker matches Bob ID');

    // Test 2: Duplicate like prevention
    console.log('\nTest 2: Duplicate like prevention');
    const dupLikeRes = await request(app)
      .post(`/api/posts/${postId}/like`)
      .set('Authorization', `Bearer ${tokenB}`);

    assert(dupLikeRes.status === 400, 'Duplicate like returns 400 Bad Request');
    assert(dupLikeRes.body.success === false, 'Duplicate like success is false');

    const dbPostDup = await Post.findById(postId);
    assert(dbPostDup.likes.length === 1, 'Post still has exactly 1 like (no duplicate entry)');

    // Test 3: Unauthenticated like attempt
    console.log('\nTest 3: Unauthenticated like attempt');
    const unauthLikeRes = await request(app)
      .post(`/api/posts/${postId}/like`);
    assert(unauthLikeRes.status === 401, 'Unauthenticated like returns 401 Unauthorized');

    // Test 4: Another user likes the post
    console.log('\nTest 4: Second user likes the post');
    const likeRes2 = await request(app)
      .post(`/api/posts/${postId}/like`)
      .set('Authorization', `Bearer ${tokenA}`);
    assert(likeRes2.status === 200, 'Second user like returns 200 OK');
    assert(likeRes2.body.data.likesCount === 2, 'Like count increments to 2');

    // Test 5: Unlike post
    console.log('\nTest 5: Authenticated unlike post');
    const unlikeRes = await request(app)
      .delete(`/api/posts/${postId}/like`)
      .set('Authorization', `Bearer ${tokenB}`);

    assert(unlikeRes.status === 200, 'DELETE /api/posts/:id/like returns 200 OK');
    assert(unlikeRes.body.data.likesCount === 1, 'Like count decrements to 1');
    assert(unlikeRes.body.data.isLiked === false, 'isLiked is false');

    // Test 6: Unlike post when not liked
    console.log('\nTest 6: Unlike post that is not liked');
    const unlikeAgainRes = await request(app)
      .delete(`/api/posts/${postId}/like`)
      .set('Authorization', `Bearer ${tokenB}`);
    assert(unlikeAgainRes.status === 400, 'Unliking un-liked post returns 400 Bad Request');

    // Test 7: Unauthenticated unlike attempt
    console.log('\nTest 7: Unauthenticated unlike attempt');
    const unauthUnlikeRes = await request(app)
      .delete(`/api/posts/${postId}/like`);
    assert(unauthUnlikeRes.status === 401, 'Unauthenticated unlike returns 401 Unauthorized');

    // Test 8: Toggle like endpoint (PUT /api/posts/:id/like)
    console.log('\nTest 8: Toggle like endpoint');
    const toggleLikeRes1 = await request(app)
      .put(`/api/posts/${postId}/like`)
      .set('Authorization', `Bearer ${tokenB}`);
    assert(toggleLikeRes1.status === 200, 'Toggle like returns 200 OK');
    assert(toggleLikeRes1.body.data.isLiked === true, 'Toggle from unliked -> liked');
    assert(toggleLikeRes1.body.data.likesCount === 2, 'Like count back to 2');

    const toggleLikeRes2 = await request(app)
      .put(`/api/posts/${postId}/like`)
      .set('Authorization', `Bearer ${tokenB}`);
    assert(toggleLikeRes2.status === 200, 'Toggle like second time returns 200 OK');
    assert(toggleLikeRes2.body.data.isLiked === false, 'Toggle from liked -> unliked');
    assert(toggleLikeRes2.body.data.likesCount === 1, 'Like count back to 1');

    // --- PART B: COMMENTS ---
    console.log('\n--- PART B: COMMENTS ---');

    // Test 9: Add valid comment
    console.log('\nTest 9: Add valid comment to post');
    const addCommentRes = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        content: 'This is a thoughtful comment on the technology post.'
      });

    assert(addCommentRes.status === 201, 'POST /api/posts/:postId/comments returns 201 Created');
    assert(addCommentRes.body.success === true, 'Response success is true');
    assert(addCommentRes.body.data.comment.content === 'This is a thoughtful comment on the technology post.', 'Comment content matches');
    assert(addCommentRes.body.data.comment.author.name === 'Bob Interactor', 'Comment author name populated');
    assert(addCommentRes.body.data.comment.author.password === undefined, 'Comment author password not exposed');
    const commentId = addCommentRes.body.data.comment._id;

    // Test 10: Reject unauthenticated comment
    console.log('\nTest 10: Reject unauthenticated comment');
    const unauthCommentRes = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .send({ content: 'Anonymous comment' });
    assert(unauthCommentRes.status === 401, 'Unauthenticated comment returns 401');

    // Test 11: Reject empty or whitespace-only comment
    console.log('\nTest 11: Reject empty or whitespace-only comments');
    const emptyCommentRes1 = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ content: '' });
    assert(emptyCommentRes1.status === 400, 'Empty comment returns 400');

    const emptyCommentRes2 = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ content: '     ' });
    assert(emptyCommentRes2.status === 400, 'Whitespace comment returns 400');

    // Test 12: Reject excessively long comment (>1000 characters)
    console.log('\nTest 12: Reject comment exceeding 1000 characters');
    const longContent = 'A'.repeat(1001);
    const longCommentRes = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ content: longContent });
    assert(longCommentRes.status === 400, 'Comment >1000 chars returns 400 Bad Request');

    // Test 13: Fetch comments for a post (Public)
    console.log('\nTest 13: Fetch comments for post (Public GET)');
    const getCommentsRes = await request(app)
      .get(`/api/posts/${postId}/comments`);

    assert(getCommentsRes.status === 200, 'GET /api/posts/:postId/comments returns 200 OK');
    assert(getCommentsRes.body.success === true, 'Response success is true');
    assert(Array.isArray(getCommentsRes.body.data), 'Returns an array of comments');
    assert(getCommentsRes.body.count >= 1, 'Comment count is at least 1');
    assert(getCommentsRes.body.data[0].author.name === 'Bob Interactor', 'First comment author matches');

    // Test 14: Update own comment
    console.log('\nTest 14: Update own comment');
    const updateCommentRes = await request(app)
      .put(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        content: 'This is an edited and refined comment.'
      });

    assert(updateCommentRes.status === 200, 'PUT /api/comments/:id returns 200 OK');
    assert(updateCommentRes.body.data.comment.content === 'This is an edited and refined comment.', 'Updated content returned');

    const dbComment = await Comment.findById(commentId);
    assert(dbComment.content === 'This is an edited and refined comment.', 'Updated content saved in DB');

    // Test 15: Prevent unauthorized user from editing another user comment
    console.log('\nTest 15: Prevent non-owner from updating comment');
    const unauthorizedEditRes = await request(app)
      .put(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${tokenA}`) // Alice trying to edit Bob's comment
      .send({ content: 'Malicious edit attempt by Alice' });

    assert(unauthorizedEditRes.status === 403, 'Non-owner comment edit returns 403 Forbidden');

    // Test 16: Prevent unauthenticated comment update
    console.log('\nTest 16: Prevent unauthenticated comment update');
    const unauthEditRes = await request(app)
      .put(`/api/comments/${commentId}`)
      .send({ content: 'Anonymous edit attempt' });
    assert(unauthEditRes.status === 401, 'Unauthenticated comment edit returns 401');

    // Test 17: Admin can edit any comment
    console.log('\nTest 17: Admin can edit any comment');
    const adminEditRes = await request(app)
      .put(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ content: 'Moderated comment content by Admin.' });

    assert(adminEditRes.status === 200, 'Admin can edit comment returns 200 OK');
    assert(adminEditRes.body.data.comment.content === 'Moderated comment content by Admin.', 'Admin edit saved');

    // Test 18: Prevent unauthorized user from deleting another user comment
    console.log('\nTest 18: Prevent non-owner from deleting comment');
    const unauthorizedDeleteRes = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${tokenA}`); // Alice trying to delete Bob's comment

    assert(unauthorizedDeleteRes.status === 403, 'Non-owner comment delete returns 403 Forbidden');

    // Test 19: Prevent unauthenticated comment delete
    console.log('\nTest 19: Prevent unauthenticated comment delete');
    const unauthDeleteRes = await request(app)
      .delete(`/api/comments/${commentId}`);
    assert(unauthDeleteRes.status === 401, 'Unauthenticated comment delete returns 401');

    // Test 20: Add a second comment for delete tests
    const comment2Res = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'Alice writes a comment to test owner delete.' });
    const comment2Id = comment2Res.body.data.comment._id;

    // Test 21: Owner deletes own comment
    console.log('\nTest 20: Owner deletes own comment');
    const deleteOwnCommentRes = await request(app)
      .delete(`/api/comments/${comment2Id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    assert(deleteOwnCommentRes.status === 200, 'DELETE /api/comments/:id returns 200 OK');
    const dbDeletedComment = await Comment.findById(comment2Id);
    assert(dbDeletedComment === null, 'Comment removed from database');

    // Test 22: Admin can delete any comment
    console.log('\nTest 21: Admin can delete any comment');
    const adminDeleteCommentRes = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    assert(adminDeleteCommentRes.status === 200, 'Admin deletes comment returns 200 OK');
    const dbAdminDeletedComment = await Comment.findById(commentId);
    assert(dbAdminDeletedComment === null, 'Comment removed by Admin from DB');

    // --- PART C: ERROR HANDLING & INTEGRATION ---
    console.log('\n--- PART C: ERROR HANDLING & CASCADE DELETION ---');

    // Test 23: Invalid ObjectId formats
    console.log('\nTest 22: Error handling for invalid ObjectIds');
    const invalidPostLikeRes = await request(app)
      .post('/api/posts/not-an-id/like')
      .set('Authorization', `Bearer ${tokenB}`);
    assert(invalidPostLikeRes.status === 400, 'Invalid post ID on like returns 400');

    const invalidCommentRes = await request(app)
      .get('/api/posts/not-an-id/comments');
    assert(invalidCommentRes.status === 400, 'Invalid post ID on get comments returns 400');

    const invalidCommentPutRes = await request(app)
      .put('/api/comments/not-an-id')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ content: 'Valid content' });
    assert(invalidCommentPutRes.status === 400, 'Invalid comment ID on update returns 400');

    // Test 24: Non-existent resources (404)
    console.log('\nTest 23: Error handling for non-existent resources');
    const fakeId = new mongoose.Types.ObjectId();
    const fakePostLikeRes = await request(app)
      .post(`/api/posts/${fakeId}/like`)
      .set('Authorization', `Bearer ${tokenB}`);
    assert(fakePostLikeRes.status === 404, 'Like on non-existent post returns 404');

    const fakePostCommentRes = await request(app)
      .post(`/api/posts/${fakeId}/comments`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ content: 'Comment on ghost post' });
    assert(fakePostCommentRes.status === 404, 'Comment on non-existent post returns 404');

    const fakeCommentDeleteRes = await request(app)
      .delete(`/api/comments/${fakeId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    assert(fakeCommentDeleteRes.status === 404, 'Delete non-existent comment returns 404');

    // Test 25: Cascade deletion: deleting a post deletes all its comments
    console.log('\nTest 24: Cascade deletion of comments on post deletion');
    // Create new post with comments
    const cascadePostRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Cascade Delete Test Post',
        content: 'Testing that comments are cleaned up when post is deleted.'
      });
    const cascadePostId = cascadePostRes.body.data.post._id;

    await request(app)
      .post(`/api/posts/${cascadePostId}/comments`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ content: 'Cascade comment 1' });
    await request(app)
      .post(`/api/posts/${cascadePostId}/comments`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ content: 'Cascade comment 2' });

    const commentsBefore = await Comment.find({ post: cascadePostId });
    assert(commentsBefore.length === 2, 'Two comments exist before post deletion');

    // Delete post
    const deletePostRes = await request(app)
      .delete(`/api/posts/${cascadePostId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    assert(deletePostRes.status === 200, 'Post successfully deleted');

    const commentsAfter = await Comment.find({ post: cascadePostId });
    assert(commentsAfter.length === 0, 'All comments deleted after post deletion (no orphaned comments)');

    console.log('\n======================================================');
    console.log(`MEMBER 3 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Member 3 test execution error:', err);
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

