const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://chotu:5D5LzNxs2HuyvUow@teammanagement.pz2ltis.mongodb.net/?appName=teammanagement').then(async () => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Demo@123', salt);
  await mongoose.connection.db.collection('users').updateMany({}, { $set: { password: hashedPassword } });
  console.log('Passwords reset to Demo@123');
  process.exit(0);
});
