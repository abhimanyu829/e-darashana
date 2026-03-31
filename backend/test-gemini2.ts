import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        console.log("Calling Gemini with gemini-2.5-flash...");
        const result = await model.generateContent("Hello?");
        console.log("Success with gemini-2.5-flash:", result.response.text());
    } catch (err: any) {
        console.error("FAILED with gemini-2.5-flash:", err.status, err.message);
    }
}
listModels();
