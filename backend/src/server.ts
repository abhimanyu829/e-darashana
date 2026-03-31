import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import connectDB from './config/db';
import courseRoutes from './routes/courseRoutes';
import syllabusRoutes from './routes/syllabusRoutes';
import taskRoutes from './routes/taskRoutes';
import activityRoutes from './routes/activityRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { initSocket, emitTimeSync } from './socket';
import logger from './config/logger';
import { startNotificationCronJobs } from './jobs/notificationCronJob';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

connectDB();

// Initialize Socket.io
initSocket(httpServer);

app.use(cors());
app.use(express.json());

app.use('/api/courses', courseRoutes);
app.use('/api/syllabus', syllabusRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Periodic time sync
setInterval(() => {
    try {
        emitTimeSync();
    } catch (e) {}
}, 60000); // Every minute

// Start push notification cron jobs (12h reminder + missed task check)
startNotificationCronJobs();

httpServer.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
