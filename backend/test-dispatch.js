require('dotenv').config();
const { getDispatchRecommendation } = require('./src/services/dispatchAI');

const testIncident = "Multi-vehicle collision on highway, 3 casualties";
const testSeverity = "Critical";
const testHospitals = [
  { 
    name: "City General Hospital", 
    availableBeds: 2, 
    wait_time_mins: 142 
  },
  { 
    name: "Northside Medical Center", 
    availableBeds: 20, 
    wait_time_mins: 45 
  },
  { 
    name: "St. Jude's Medical Institute", 
    availableBeds: 45, 
    wait_time_mins: 12 
  }
];

const runTest = async () => {
  try {
    console.log("Testing Dispatch AI...");
    const result = await getDispatchRecommendation(
      testIncident,
      testSeverity, 
      testHospitals
    );
    console.log("\n=== TERMINAL LOGS ===");
    result.terminal_logs.forEach(log => console.log(log));
    
    console.log("\n=== RECOMMENDATION ===");
    console.log("Hospital:", result.recommendation.hospital_name);
    console.log("Reason:", result.recommendation.reason);
    console.log("ETA:", result.recommendation.estimated_eta);
    console.log("✅ Dispatch AI working!");
  } catch (error) {
    console.error("Test failed:", error);
  }
};

runTest();
