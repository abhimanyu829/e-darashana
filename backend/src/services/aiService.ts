import { GoogleGenerativeAI } from "@google/generative-ai";
import { TopicsMaster } from '../models/TopicsMaster';
import { SyllabusRaw } from '../models/SyllabusRaw';
import { Course } from '../models/Course';
import logger from '../config/logger';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  logger.warn('WARNING: GEMINI_API_KEY is not set in .env');
}
const genAI = new GoogleGenerativeAI(apiKey || '');

function preprocessSyllabus(text: string): string {
    // Retain structural line breaks so AI natively identifies list items
    let cleaned = text.replace(/UNIT[-\s]*[IVX\d]+/gi, ' ');
    cleaned = cleaned.replace(/^\s*\d+[\.\)]?\s*/gm, ' ');
    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim(); 
    return cleaned;
}

export const parseSyllabusAndGenerateTopics = async (syllabusId: string) => {
  const syllabus = await SyllabusRaw.findById(syllabusId).lean();
  if (!syllabus) throw new Error('Syllabus not found');

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  logger.info(`[AI-PIPELINE] Calling Gemini to parse syllabus ${syllabusId}`);

  const preprocessedText = preprocessSyllabus(syllabus.syllabusText || '');
  logger.info('[AI-PIPELINE] Preprocessing completed.');

  const prompt = `
You are an academic planner AI.
Convert the provided Syllabus Text into a strictly formatted JSON structure.

RULES:
1. Divide the syllabus into logical units.
2. Group related concepts into singular, meaningful topic blocks.
3. DO NOT output comma-separated lists of concepts (e.g., instead of "AI, ML, DL", output "Types of Machine Learning Techniques").
4. Keep maximum 4-8 comprehensive topics per unit.
5. Output STRICT JSON only. Do not add markdown blocks or explanations.

OUTPUT FORMAT (STRICT JSON):
{
  "units": [
    {
      "unitName": "string",
      "topics": [
        { "topicTitle": "string" }
      ]
    }
  ]
}

Syllabus Text:
${preprocessedText}
`;

  let parsed;
  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const cleaned = responseText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    parsed = JSON.parse(cleaned);

    if (!parsed || !Array.isArray(parsed.units)) {
      if (Array.isArray(parsed)) {
        parsed = { units: parsed };
      } else if (parsed && parsed.syllabus && Array.isArray(parsed.syllabus.units)) {
        parsed = { units: parsed.syllabus.units };
      } else if (parsed && Array.isArray(parsed.syllabus)) {
        parsed = { units: parsed.syllabus };
      } else {
         throw new Error("Invalid structure from GenAI");
      }
    }
    logger.info('[AI-PIPELINE] Gemini API Parsing Success.');
  } catch (err) {
    logger.warn(`[AI-PIPELINE] AI Error, successfully engaged NLP Fallback mechanism. Error: ${(err as Error).message}`);
    // PHASE 9: FALLBACK PARSER
    const rawSentences = (syllabus.syllabusText || '')
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 5);

    const fallbackTopics = [];
    for (const sentence of rawSentences) {
        fallbackTopics.push({ topicTitle: sentence.substring(0, 150) });
    }

    if (fallbackTopics.length === 0) {
      fallbackTopics.push({ topicTitle: "Study Material Segment 1" });
    }

    parsed = {
      units: [{
        unitName: "General Curriculum",
        topics: fallbackTopics
      }]
    };
  }

  // 🔢 Add globalOrderIndex and Post-Process validation
  let index = 0;
  let validTopicsCount = 0;

  parsed.units = parsed.units.map((unit: any) => {
    const rawTopics = Array.isArray(unit.topics) ? unit.topics : [];
    
    // 1. Initial Mapping & Handling AI Drift
    const initialTopics = rawTopics.map((t: any) => ({
      ...t,
      topicTitle: t.topicTitle || t.topicName || "Untitled Topic"
    }));

    // 2. Explode Comma-separated strings into multiple topics
    const explodedTopics: any[] = [];
    initialTopics.forEach((t: any) => {
      if (t.topicTitle.includes(",")) {
        // Split by comma and filter out empty bits
        const parts = t.topicTitle.split(",").map((p: string) => p.trim()).filter((p: string) => p.length > 2);
        parts.forEach((part: string) => {
          explodedTopics.push({ topicTitle: part });
        });
      } else {
        explodedTopics.push(t);
      }
    });

    // 3. Post-Processing validation limits (length check + noise filter)
    const REJECTED_HEADERS = /^(topics\s+covered|unit[-\s]*[ivx\d]+|general\s+instructions|syllabus|course\s+content|index|introduction|contents)[:]?$/i;
    
    const validTopics = explodedTopics.filter((t: any) => {
      const title = t.topicTitle.trim();
      return title.length >= 3 && !REJECTED_HEADERS.test(title);
    });

    // If unit filtered completely, provide a safe fallback topic from original
    if (validTopics.length === 0 && explodedTopics.length > 0) {
       validTopics.push({ topicTitle: explodedTopics[0].topicTitle.substring(0, 50) || "Curriculum Segment" });
    }

    return {
      ...unit,
      unitName: unit.unitName || "Unit",
      topics: validTopics.map((t: any) => {
        validTopicsCount++;
        return {
          topicTitle: t.topicTitle.trim(),
          globalOrderIndex: index++
        };
      })
    };
  });

  logger.info(`[AI-PIPELINE] Post-processing completed. Found ${validTopicsCount} valid topics.`);

  // --- PHASE 1 & 2: CORE MATH & PRE-SCHEDULING ENGINE ---
  const course = await Course.findById(syllabus.courseId).lean();
  const D = course?.durationDays || 30;
  const T = index; // total topics
  const topicsPerDay = Math.ceil(T / D) || 1;

  const preSchedule = [];
  let currentDay = 1;
  let currentDayTopics: number[] = [];

  const allOrderedTopics = parsed.units.flatMap((u: any) => u.topics).sort((a: any, b: any) => a.globalOrderIndex - b.globalOrderIndex);

  for (const topic of allOrderedTopics) {
    if (currentDayTopics.length >= topicsPerDay) {
      preSchedule.push({ dayNumber: currentDay, topics: currentDayTopics });
      currentDay++;
      currentDayTopics = [];
    }
    currentDayTopics.push(topic.globalOrderIndex);
  }
  if (currentDayTopics.length > 0) {
    preSchedule.push({ dayNumber: currentDay, topics: currentDayTopics });
  }

  const topicsMaster = await TopicsMaster.findOneAndUpdate(
    { courseId: syllabus.courseId, userId: syllabus.userId },
    { units: parsed.units, preSchedule, section: course?.section || 'academic' },
    { new: true, upsert: true }
  );

  return topicsMaster;
};