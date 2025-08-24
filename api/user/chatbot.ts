import GenAI from "../../lib/chatbot"

async function getChatbotResponse(message: string): Promise<string> {
    const response = await GenAI.models.generateContent({
        model: "gemini-2.5-flash", // or "gemini-pro" if available
        contents: [{ role: "user", parts: [{ text: message }] }],
    });

    return extractText(response);
}

function extractText(res: any): string {
  return res.candidates?.[0]?.content?.parts?.[0]?.text || "";
}