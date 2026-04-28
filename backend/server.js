require('dotenv').config()

const app = require('./src/app');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./src/config/db');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'process.env.FRONTEND_URL'].filter(Boolean),
    methods: ['GET', 'POST', 'PATCH'],
    credentials: true,
  },
});

const { setIO } = require('./src/config/socket');
setIO(io);

const { startEscalationService } = require('./src/services/escalationService');
startEscalationService();

io.on('connection', (socket) => {
  console.log(` Client connected: ${socket.id}`)

  socket.on('disconnect', () => {
    console.log(` Client disconnected: 
      ${socket.id}`)
  })
})

connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`HealthSync backend running on port ${PORT}`);
});

/*
=== HEALTHSYNC SOCKET EVENTS ===

PATIENT EVENTS:
→ "newPatient"
   Fired: When nurse triages new patient
   Data: Full patient object with aiTriage

→ "patientRemoved"
   Fired: When doctor admits patient
   Data: { id: patientId }

→ "criticalPatientAlert"
   Fired: When priority 1 patient is triaged
   Data: { patientId, patientName, age, 
           complaint, department, vitals,
           hospitalName, timestamp }

→ "patientEscalated"
   Fired: Every 5 mins by escalation service
   Data: { patientId, patientName, oldLevel,
           newLevel, newLabel, waitMinutes,
           department, message }

→ "patientAdmitted"
   Fired: When doctor admits patient
   Data: { patientId, patientName, 
           hospitalName, department, admittedAt }

→ "patientTransferred"
   Fired: When bed request approved
   Data: { patientId, patientName, 
           fromHospital, toHospital, reason }

HOSPITAL EVENTS:
→ "hospitalUpdated"
   Fired: When beds change for any reason
   Data: Full hospital object

→ "ambulanceDispatched"
   Fired: When dispatcher confirms dispatch
   Data: { hospitalName, remainingBeds, 
           capacity, dispatchedAt }

DISPATCH EVENTS:
→ "dispatchRecommendation"
   Fired: When AI generates routing recommendation
   Data: { terminal_logs, recommendation }
===================================
*/
