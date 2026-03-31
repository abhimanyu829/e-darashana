import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import logger from './config/logger';

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Adjust for production
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join', (userId: string) => {
      socket.join(userId);
      logger.info(`User ${userId} joined their socket room`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

/**
 * STEP 15: REAL-TIME RULE
 * Sync timers using server time
 */
export const emitTimeSync = () => {
    const io = getIO();
    io.emit('time-sync', { serverTime: new Date().toISOString() });
};
