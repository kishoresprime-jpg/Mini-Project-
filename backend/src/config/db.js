const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('\x1b[31m%s\x1b[0m', '=====================================================');
      console.error('\x1b[31m%s\x1b[0m', 'ERROR: MONGODB_URI is not defined in your environment (.env file)!');
      console.error('\x1b[33m%s\x1b[0m', 'Please specify a valid MongoDB connection string:');
      console.error('\x1b[36m%s\x1b[0m', 'Local instance: mongodb://127.0.0.1:27017/college_workflow');
      console.error('\x1b[36m%s\x1b[0m', 'MongoDB Atlas: mongodb+srv://<user>:<password>@cluster.mongodb.net/college_workflow');
      console.error('\x1b[31m%s\x1b[0m', '=====================================================');
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log('\x1b[32m%s\x1b[0m', `>>> MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '=====================================================');
    console.error('\x1b[31m%s\x1b[0m', 'DATABASE CONNECTION FAILED:');
    console.error('\x1b[31m%s\x1b[0m', error.message);
    console.error('\x1b[33m%s\x1b[0m', 'Ensure MongoDB is running locally (e.g., mongod or MongoDB Community Service)');
    console.error('\x1b[33m%s\x1b[0m', 'OR supply a free MongoDB Atlas connection string in backend/.env:');
    console.error('\x1b[36m%s\x1b[0m', 'MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/college_workflow');
    console.error('\x1b[31m%s\x1b[0m', '=====================================================');
    process.exit(1);
  }
};

module.exports = connectDB;

