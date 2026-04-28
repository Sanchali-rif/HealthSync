const express = require('express');
const cors = require('cors');
const patientRoutes = require('./routes/patientRoutes');
const authRoutes = require('./routes/authRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const dispatchRoutes = require('./routes/dispatchRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

const corsOptions = {
   origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'process.env.FRONTEND_URL'].filter(Boolean),
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use((req, res, next) => {
  res.setHeader(
    'Cross-Origin-Opener-Policy',
    'same-origin-allow-popups'
  )
  res.setHeader(
    'Cross-Origin-Embedder-Policy',
    'unsafe-none'
  )
  next()
})
app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'HealthSync API is running', status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dispatch', dispatchRoutes);

module.exports = app;
