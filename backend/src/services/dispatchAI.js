const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash"
});

const getDispatchRecommendation = async (incident, severity, hospitals) => {
  try {
    const hospitalData = hospitals.map(h => 
      `- ${h.name}: ${h.availableBeds} beds available, wait time: ${h.wait_time_mins} minutes`
    ).join('\n');

    const systemPrompt = `You are an advanced Emergency Medical Dispatch AI for the HealthSync platform.
Your primary objective is to analyze inbound critical emergencies and route ambulances to the most optimal hospital in the regional network to prevent facility overloading and minimize patient wait times.

You will receive emergency incident details and live telemetry of all regional hospitals.

YOUR RULES:
1. NEVER route a Critical patient to a hospital with fewer than 5 available beds OR a wait time exceeding 60 minutes, unless there are no other options.
2. Prioritize hospitals with lowest utilization and wait times.
3. You must respond ONLY with a valid JSON object. No markdown. No extra text. No code fences.

REQUIRED JSON OUTPUT FORMAT:
{
  "terminal_logs": [
    "[HH:MM:SS] Scanning regional telemetry...",
    "[HH:MM:SS] ALERT: [Bottleneck Hospital] at capacity threshold.",
    "[HH:MM:SS] Recalculating efficient routing paths...",
    "[HH:MM:SS] PATH OPTIMIZED: Primary redirect to [Chosen Hospital Name]."
  ],
  "recommendation": {
    "hospital_name": "Name of chosen hospital",
    "reason": "Brief technical reason",
    "estimated_eta": "e.g. 4.2m"
  }
}`;

    const userMessage = `Emergency Incident: ${incident}
Severity: ${severity}

Regional Hospital Telemetry:
${hospitalData}

Analyze and provide optimal dispatch routing.`;

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userMessage }
    ]);

    const text = result.response.text();
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const now = new Date();
    const logsWithTime = parsed.terminal_logs.map((log, index) => {
      const logTime = new Date(now.getTime() + index * 1000);
      const hours = String(logTime.getHours()).padStart(2, '0');
      const minutes = String(logTime.getMinutes()).padStart(2, '0');
      const seconds = String(logTime.getSeconds()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}:${seconds}`;
      return log.replace(/\[\d{2}:\d{2}:\d{2}\]/, `[${timeStr}]`);
    });

    return {
      terminal_logs: logsWithTime,
      recommendation: parsed.recommendation
    };

  } catch (error) {
    throw new Error("Dispatch AI Failed: " + error.message);
  }
};

module.exports = { getDispatchRecommendation };
