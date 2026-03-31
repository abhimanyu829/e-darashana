import { parseSyllabusAndGenerateTopics } from './src/services/aiService';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function testAI() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chronos-ai';
        await mongoose.connect(uri);
        console.log('MongoDB connected');

        // We need a test syllabus ID. Instead of hardcoding, let's just test Gemini directly.
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Hello");
        console.log("Success:", result.response.text());
    } catch (error) {
        console.error("Test Error:", error);
    } finally {
        mongoose.disconnect();
    }
}
testAI();
