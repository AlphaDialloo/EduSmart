const mongoose = require('mongoose');
module.exports = async function connectMongo() {
  const options = process.env.NODE_ENV === 'production' ? {
    dbName: 'edusmart'
  } : {};
  await mongoose.connect(process.env.MONGO_URI, options);
  console.log('MongoDB connecté');
};
