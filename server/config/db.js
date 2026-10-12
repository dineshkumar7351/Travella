import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/travelmind', {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.warn(`[MongoDB Warning] Local database not detected (${error.message}).`);
    console.warn('[MongoDB Warning] AI Planner & Route features run in live mode; to persist saved user trips, ensure MongoDB service is active or set MONGODB_URI in server/.env.');
  }
};

export default connectDB;
