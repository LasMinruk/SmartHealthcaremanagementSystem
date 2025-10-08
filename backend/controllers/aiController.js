import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure the API key exists; if not, we'll fall back to a deterministic response
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// POST /api/ai/triage
export const triage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.json({ success: false, message: "Missing message" });
    }

    const specialityList = [
      "General physician",
      "Dermatologist",
      "Neurologist",
      "Gastroenterologist",
      "Gynecologist",
      "Pediatricians"
    ];

    if (!openai && !genAI) {
      // Fallback deterministic routing if no API key provided
      const lower = message.toLowerCase();
      let speciality = "General physician";
      if (/(skin|rash|acne|itch|psoriasis|eczema)/.test(lower)) speciality = "Dermatologist";
      else if (/(headache|migraine|seizure|stroke|numb|dizzy|memory)/.test(lower)) speciality = "Neurologist";
      else if (/(stomach|abdomen|gas|ulcer|liver|ibs|nausea|vomit|diarrhea)/.test(lower)) speciality = "Gastroenterologist";
      else if (/(period|pregnan|fertilit|pcos|pcod|pelvic|gyne)/.test(lower)) speciality = "Gynecologist";
      else if (/(child|kid|pediatric|vaccine)/.test(lower)) speciality = "Pediatricians";

      const reply = `Based on your description, consulting a ${speciality} may be helpful. This is not a diagnosis; for emergencies, seek urgent care.`;
      return res.json({ success: true, reply, speciality });
    }

    const system = `You are a medical triage assistant. Given a patient's free-text symptoms, respond with a short, empathetic, non-diagnostic guidance and suggest one most-appropriate speciality strictly from this list: ${specialityList.join(", ")}. Output strict JSON with keys: reply (string, <= 3 sentences, no newlines), speciality (one of the list). Avoid disclaimers beyond basic safety.`;

    let payload = {};

    if (genAI) {
      const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
      const prompt = `${system}\nUser: ${message}\nRespond with JSON only.`
      const resp = await model.generateContent(prompt);
      const text = (await resp.response.text()) || "{}";
      try { payload = JSON.parse(text); } catch { payload = {}; }
    } else if (openai) {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: message }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 200
      });
      const content = completion.choices?.[0]?.message?.content || "{}";
      try { payload = JSON.parse(content); } catch { payload = {}; }
    }

    let { reply, speciality } = payload;
    if (!specialityList.includes(speciality)) speciality = "General physician";
    if (!reply || typeof reply !== 'string') reply = "A General physician is a good starting point for initial evaluation.";

    return res.json({ success: true, reply, speciality });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};


