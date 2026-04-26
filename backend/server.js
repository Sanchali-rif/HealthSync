require('dotenv').config()

const app = require('./src/app');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./src/config/db');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH'],
    credentials: true,
  },
});

const { setIO } = require('./src/config/socket');
setIO(io);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`HealthSync backend running on port ${PORT}`);
});
