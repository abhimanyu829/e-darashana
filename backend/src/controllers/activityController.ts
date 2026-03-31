import { Request, Response } from 'express';
import { ActivityLog } from '../models/ActivityLog';
import logger from '../config/logger';

export const getActivityLogs = async (req: Request, res: Response) => {
  try {
    const { section } = req.query;
    const userId = (req as any).userId;

    if (!section) {
      return res.status(400).json({ message: 'section is required' });
    }

    // Fetch the activity logs for this section and user
    // In a real production setting, you might paginate or filter by year
    // For the contribution grid, typically a full 1-year history is fetched.
    const logs = await ActivityLog.find({ userId, section }).sort({ date: 1 }).lean();

    res.json(logs);
  } catch (error) {
    logger.error('Error fetching activity logs:', error);
    res.status(500).json({ message: 'Error fetching activity logs', error });
  }
};
