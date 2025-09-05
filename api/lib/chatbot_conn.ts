import { GoogleGenerativeAI } from "@google/generative-ai";
import { defineEventHandler, readBody } from "h3";

const genAI = new GoogleGenerativeAI(process.env.CHATBOT_API_KEY || "");

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{ prompt: string }>(event);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(body.prompt);
    return { reply: result.response.text() };
  } catch (err: any) {
    return { error: err.message || "Something went wrong" };
  }
});