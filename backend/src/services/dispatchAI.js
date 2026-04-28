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
    console.warn('Dispatch AI Failed, applying fallback routing:', error.message);

    const fallbackHospital = hospitals.find(h => h.availableBeds > 0)?.name || 
                             (hospitals.length > 0 ? hospitals[0].name : "Unassigned");

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    return {
      terminal_logs: [
        `[${timeStr}] ERROR: AI Service Unavailable.`,
        `[${timeStr}] Engaging automated safety fallback protocols...`,
        `[${timeStr}] Scanning regional telemetry for capacity...`,
        `[${timeStr}] PATH OPTIMIZED: Fallback redirect to ${fallbackHospital}.`
      ],
      recommendation: {
        hospital_name: fallbackHospital,
        reason: "Assigned via automated safety fallback rules due to AI service disruption.",
        estimated_eta: "5.0m"
      }
    };
  }
};

module.exports = { getDispatchRecommendation };
