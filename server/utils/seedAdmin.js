const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../models/User');

dotenv.config();

/**
 * Utility script to safely seed or promote an admin account.
 * Usage: node utils/seedAdmin.js <email> <name> <password>
 * Or uses environment defaults: ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD
 */
const seedAdmin = async () => {
  const email = process.argv[2] || process.env.ADMIN_EMAIL || 'admin@posthub.com';
  const name = process.argv[3] || process.env.ADMIN_NAME || 'Platform Administrator';
  const password = process.argv[4] || process.env.ADMIN_PASSWORD || 'Admin@123456';

  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/post_management_system';

  try {
    console.log(`[SeedAdmin] Connecting to database at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('[SeedAdmin] Connected to MongoDB.');

    const normalizedEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      if (user.role === 'admin') {
        console.log(`[SeedAdmin] User ${normalizedEmail} is already an Administrator.`);
      } else {
        user.role = 'admin';
        await user.save();
        console.log(`[SeedAdmin] Successfully promoted existing user ${normalizedEmail} to Administrator.`);
      }
    } else {
      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: password,
        role: 'admin'
      });
      console.log(`[SeedAdmin] Created new Administrator account: ${normalizedEmail}`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(`[SeedAdmin Error]: ${err.message}`);
    process.exit(1);
  }
};

if (require.main === module) {
  seedAdmin();
}

module.exports = seedAdmin;
