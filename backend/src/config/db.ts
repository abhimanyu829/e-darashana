import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chronos-ai';
    await mongoose.connect(uri);
    const ping = await mongoose.connection.db.admin().ping();
    logger.info('MongoDB connected');
    logger.info(`MongoDB ping: ${JSON.stringify(ping)}`);
  } catch (error) {
    logger.error('MongoDB connection error:', error as any);
    process.exit(1);
  }
};

export default connectDB;
