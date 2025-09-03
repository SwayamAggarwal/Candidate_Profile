const mongoose = require('mongoose');

async function connectDB(uri) {
  mongoose.set('strictQuery', true);
  const DB_NAME = process.env.DB_NAME;
  const MONGODB_USER = process.env.MONGODB_USER;
  const MONGODB_PASS = process.env.MONGODB_PASS;
  const AUTH_SOURCE = process.env.MONGODB_AUTH_SOURCE; // optional, Atlas usually not needed
  await mongoose.connect(uri, {
    autoIndex: true,
    dbName: DB_NAME || undefined,
    user: MONGODB_USER || undefined,
    pass: MONGODB_PASS || undefined,
    authSource: AUTH_SOURCE || undefined,
  });
  return mongoose.connection;
}

module.exports = { connectDB };
