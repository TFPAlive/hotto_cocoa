import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.CHATBOT_API_KEY || "");

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "No prompt provided" });
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", 
      systemInstruction: `
    You are a friendly AI assistant for an e-commerce shop that sells chocolate drinks. 
    Your role is to recommend the best chocolate drink for customers based on their tastes and preferences. 

    Guidelines:
    - Only talk about chocolate drinks sold in this shop.
    - Ask clarifying questions if the customer’s request is vague (e.g., "Do you like sweeter or more bitter chocolate?").
    - If the user asks about something unrelated (like cars, math, or news), politely reply: 
      "I can only help you with chocolate drink recommendations." or some similar response.
    - Be concise, polite, and easy to understand.
    `,
    });

    const result = await model.generateContent(prompt);

    res.status(200).json({ reply: result.response.text() });
  } catch (err) {
    console.error("Chatbot API error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
}
