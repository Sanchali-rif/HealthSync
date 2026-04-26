const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log("GEMINI_API_KEY loaded:", process.env.GEMINI_API_KEY ? "YES - " + process.env.GEMINI_API_KEY.substring(0, 10) + "..." : "NO - KEY IS MISSING");
console.log("GEMINI_MODEL loaded:", process.env.GEMINI_MODEL || "NOT SET");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash"
});

const getAITriage = async (patientData, hospitals = []) => {
  try {
    const hospitalInfo = hospitals.length > 0
      ? hospitals.map(h => 
          `- ${h.name}: ${h.availableBeds} beds available, Specializations: ${h.specializations.join(", ")}`
        ).join("\n")
      : "No hospital data available";

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

    Available Hospitals:
    ${hospitalInfo}

    You must assign the department from ONLY
    this list:
    Resuscitation, Emergency, Cardiology, Trauma,
    Neurology, Orthopaedics, Paediatrics,
    Gynaecology, Psychiatry, General OPD, ICU,
    Burns Unit, Toxicology, Respiratory,
    Gastroenterology, Urology, Ophthalmology,
    ENT, Dermatology, Oncology, Nephrology,
    Endocrinology, Vascular Surgery,
    Plastic Surgery, Dental Emergency

    Based on the patient severity and hospital
    bed availability and specializations,
    suggest the most appropriate hospital.
    If a hospital has 0 available beds do NOT
    suggest it unless it is the only option.

    Respond ONLY with a valid raw JSON object.
    No markdown. No explanation. No code fences.
    Use exactly this structure:
    {
      "priorityLevel": 1,
      "priorityLabel": "Critical",
      "department": "Cardiology",
      "justification": "One sentence medical reason.",
      "suggestedHospital": "Northside Medical Center",
      "dispatchReason": "One sentence why this hospital."
    }`;

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
    
    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
    } catch (parseError) {
      throw new Error('Failed to parse AI response as JSON: ' + cleanedText);
    }

    return parsed;
  } catch (error) {
    throw new Error('AI Triage Failed: ' + error.message);
  }
};

module.exports = getAITriage;
