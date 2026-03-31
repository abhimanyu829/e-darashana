import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    try {
        const apiKey = process.env.GEMINI_API_KEY!;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        console.log("AVAILABLE MODELS:", data.models?.map((m: any) => m.name).join(', '));
        if (data.error) {
            console.error("API ERROR:", data.error);
        }
    } catch (err: any) {
        console.error("FAILED to list models:", err.message);
    }
}
listModels();
