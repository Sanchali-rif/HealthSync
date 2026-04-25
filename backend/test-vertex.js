require('dotenv').config();
const { VertexAI } = require('@google-cloud/vertexai');

const vertexAI = new VertexAI({
  project: process.env.VERTEX_PROJECT_ID,
  location: process.env.VERTEX_LOCATION,
  googleAuthOptions: {
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    }
  }
});

const model = vertexAI.getGenerativeModel({
  model: process.env.VERTEX_MODEL
});

const testTriage = async () => {
  try {
    console.log("🔄 Testing Vertex AI connection...");

    const prompt = `You are an emergency room triage AI.
Analyze this patient and respond ONLY with 
a valid JSON object. No markdown. No extra text.
No code fences. Just raw JSON.

Patient:
- Age: 55
- Gender: Male
- Chief Complaint: Severe chest pain radiating 
  to left arm
- Heart Rate: 120 bpm
- Blood Pressure: 160/100
- Temperature: 37.5 C
- SpO2: 93%

Respond with exactly this structure:
{
  "priorityLevel": 1,
  "priorityLabel": "Critical",
  "department": "Cardiology",
  "justification": "one sentence medical reason"
}
Priority rules: 1=Critical, 2=Urgent, 
3=Priority, 4=Non-Urgent`;

    const result = await model.generateContent(prompt);

    const text = result.response.candidates[0].content.parts[0].text;

    console.log("Raw AI Response:");
    console.log(text);

    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    console.log("Vertex AI is working!");
    console.log("Parsed Triage Result:");
    console.log(parsed);
    console.log("Priority Level: " + parsed.priorityLevel);
    console.log("Priority Label: " + parsed.priorityLabel);
    console.log("Department: " + parsed.department);
    console.log("Justification: " + parsed.justification);

  } catch (error) {
    console.log("❌ Vertex AI Error: " + error.message);
    console.log("Full error: " + error);
  }
};

testTriage();
