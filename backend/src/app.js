const express = require('express');
const cors = require('cors');
const patientRoutes = require('./routes/patientRoutes');

const app = express();

const corsOptions = {
  origin: ['http://localhost:5173'],
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'HealthSync API is running', status: 'ok' });
});

app.use('/api/patients', patientRoutes);

module.exports = app;
