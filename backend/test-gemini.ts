import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

async function testParams() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); // safe fallback
        console.log("Calling Gemini...");
        const result = await model.generateContent("Hello, are you there?");
        console.log("Success:", result.response.text());
    } catch (err: any) {
        console.error("FAILED with:", err.status, err.message);
        if (err.response) {
            console.error("Response data:", err.response);
        }
    }
}
testParams();
