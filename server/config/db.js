const mongoose = require('mongoose');

/**
 * Connect to MongoDB using Mongoose.
 * Supports connection URI from environment variable MONGO_URI.
 * Automatically handles connection errors gracefully.
 */
const connectDB = async (customUri = null) => {
  const uri = customUri || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/post_management';

  try {
    const conn = await mongoose.connect(uri);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    // If not in a test runner, exit process on fatal DB error
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[Database] Tip: Ensure MongoDB is running locally or specify a valid MONGO_URI in server/.env');
    }
    throw error;
  }
};

module.exports = connectDB;
