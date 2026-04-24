const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log("GEMINI_API_KEY loaded:", process.env.GEMINI_API_KEY ? "YES - " + process.env.GEMINI_API_KEY.substring(0, 10) + "..." : "NO - KEY IS MISSING");
console.log("GEMINI_MODEL loaded:", process.env.GEMINI_MODEL || "NOT SET");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash"
});

const getAITriage = async (patientData) => {
  try {
    const prompt = `You are an expert emergency room triage AI. 
Analyze the following patient data and assign 
a triage priority strictly based on Emergency 
Severity Index (ESI) protocols.

Patient Data:
- Age: ${patientData.age}
- Chief Complaint: ${patientData.complaint}
- Heart Rate: ${patientData.vitals.hr} bpm
- Blood Pressure: ${patientData.vitals.bp}
- Temperature: ${patientData.vitals.temp} C
- SpO2: ${patientData.vitals.spo2}%

Respond ONLY with a valid raw JSON object.
No markdown. No explanation. No code fences. 
No extra text whatsoever.
Use exactly this structure:
{
  "priorityLevel": 1,
  "priorityLabel": "Critical",
  "department": "Cardiology",
  "justification": "One sentence medical reason."
}
Priority rules: 
1 = Critical
2 = Urgent
3 = Priority
4 = Non-Urgent`;

    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (error) {
      const msg = error.message || '';
      if (msg.includes('quota') || msg.includes('429') || msg.includes('rate')) {
        console.log('Rate limit hit, retrying in 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        result = await model.generateContent(prompt);
      } else {
        throw error;
      }
    }

    const text = result.response.text();
    const cleanedText = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanedText);

    return parsed;
  } catch (error) {
    throw new Error('AI Triage Failed: ' + error.message);
  }
};

module.exports = getAITriage;
