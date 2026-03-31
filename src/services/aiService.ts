import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

export const parseSyllabus = async (text: string) => {
  const ai = getAiClient();
  const model = "gemini-3-flash-preview";
  const prompt = `
    Parse the following syllabus text into a structured JSON format.
    Return an array of subjects, where each subject contains an array of chapters, and each chapter contains an array of topics.
    
    Structure:
    {
      "subjects": [
        {
          "name": "Subject Name",
          "chapters": [
            {
              "name": "Chapter Name",
              "topics": ["Topic 1", "Topic 2"]
            }
          ]
        }
      ]
    }
    
    Text:
    ${text}
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  return JSON.parse(response.text);
};

export const suggestOptimalSchedule = async (tasks: any[], dailyHours: number) => {
  const ai = getAiClient();
  const model = "gemini-3-flash-preview";
  const prompt = `
    Given the following tasks and a daily limit of ${dailyHours} hours, suggest the most optimal execution order.
    Consider priority, deadline proximity, and productivity impact.
    
    Tasks:
    ${JSON.stringify(tasks)}
    
    Return the suggested order as a list of task IDs.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text;
};
