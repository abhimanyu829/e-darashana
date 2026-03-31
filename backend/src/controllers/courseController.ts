import { Request, Response } from 'express';
import { Course } from '../models/Course';
import { SyllabusRaw } from '../models/SyllabusRaw';
import { TopicsMaster } from '../models/TopicsMaster';
import { z } from 'zod';

const createCourseSchema = z.object({
  name: z.string().min(3),
  durationDays: z.coerce.number().positive(),
  dailyStudyHours: z.coerce.number().positive(),
  section: z.enum(['academic', 'exam', 'skill', 'placement', 'project', 'othertasks'])
});

export const createCourse = async (req: Request, res: Response) => {
  try {
    console.log("BODY:", req.body);
    console.log("USER:", (req as any).userId);
    const validated = createCourseSchema.parse(req.body);
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: userId missing' });
    }

    const course = new Course({
      ...validated,
      userId,
    });
    await course.save();

    const syllabusRaw = new SyllabusRaw({
      userId,
      courseId: course._id,
      syllabusText: ''
    });
    await syllabusRaw.save();

    res.status(201).json(course);
  } catch (error) {
    console.error("CREATE COURSE ERROR:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation failed', errors: error.issues });
    }
    res.status(500).json({ message: (error as Error).message || 'Error creating course' });
  }
};

export const getCourses = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: userId missing' });
    }
    const courses = await Course.find({ userId }).lean();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses', error });
  }
};

import { DailyTask } from '../models/DailyTask';

export const deleteCourse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: userId missing' });
    }

    const course = await Course.findOneAndDelete({ _id: id, userId });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    await SyllabusRaw.deleteOne({ courseId: id, userId });
    await TopicsMaster.deleteOne({ courseId: id, userId });
    await DailyTask.deleteMany({ courseId: id, userId });

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting course', error });
  }
};

export const getTopics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: userId missing' });
    }

    const topicsMaster = await TopicsMaster.findOne({ courseId: id, userId });
    res.json(topicsMaster || { units: [] });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching topics', error });
  }
};
