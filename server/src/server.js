const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const User = require('./models/User');
const seedDatabase = require('./seeds/seedData');
const app = require('./app');

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Start Server after connecting DB & seeding if needed
const startServer = async () => {
  try {
    await connectDB();

    // Check if database needs initial seeding
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Startup] No users found. Seeding NovaTech Solutions default org structure...');
      await seedDatabase();
    } else {
      console.log(`[Startup] Database active with ${userCount} existing users.`);
    }

    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 NovaTech Solutions Server running on port ${PORT}`);
      console.log(`📡 API Base: http://localhost:${PORT}/api`);
      console.log(`🏢 Organization: NovaTech Solutions Pvt. Ltd.`);
      console.log(`====================================================`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Error: Port ${PORT} is already in use by another process.`);
        console.error(`👉 Stop the existing process running on port ${PORT} or specify a different PORT in .env\n`);
      } else {
        console.error('Server error:', err);
      }
      process.exit(1);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
