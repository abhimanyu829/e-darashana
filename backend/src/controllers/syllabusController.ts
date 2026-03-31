import { Request, Response } from 'express';
import { SyllabusRaw } from '../models/SyllabusRaw';
import { TopicsMaster } from '../models/TopicsMaster';
import { parseSyllabusAndGenerateTopics } from '../services/aiService';
import { z } from 'zod';

const uploadSyllabusSchema = z.object({
  courseId: z.string(),
  syllabusText: z.string().min(10),
});

export const uploadSyllabus = async (req: Request, res: Response) => {
  try {
    const validated = uploadSyllabusSchema.parse(req.body);
    const userId = (req as any).userId;

    const syllabus = await SyllabusRaw.findOneAndUpdate(
      { courseId: validated.courseId, userId },
      { syllabusText: validated.syllabusText },
      { new: true, upsert: true }
    );

    if (!syllabus) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.status(200).json(syllabus);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation failed', errors: error.issues });
    }
    res.status(500).json({ message: 'Error uploading syllabus', error });
  }
};

export const parseSyllabus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: userId missing' });
    }

    const syllabus = await SyllabusRaw.findOne({ _id: id, userId });

    if (!syllabus) {
      return res.status(404).json({ message: 'Syllabus not found for this user' });
    }

    if (!syllabus.syllabusText || syllabus.syllabusText.trim().length < 10) {
      return res.status(400).json({ message: 'Syllabus text is too short or empty. Please upload syllabus content first.' });
    }

    console.log(`[PARSE] Parsing syllabus ${id} for user ${userId}...`);
    const topicsMaster = await parseSyllabusAndGenerateTopics(id);

    res.status(200).json(topicsMaster);
  } catch (error) {
    console.error("PARSE SYLLABUS ERROR:", error);
    res.status(500).json({ message: (error as Error).message || 'Error parsing syllabus' });
  }
};