const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  complaint: { type: String, required: true },
  vitals: {
    hr: { type: Number },
    bp: { type: String },
    temp: { type: Number },
    spo2: { type: Number },
  },
  aiTriage: {
    priorityLevel: { type: Number },
    priorityLabel: { type: String },
    department: { type: String },
    justification: { type: String },
  },
  status: {
    type: String,
    enum: ['Waiting', 'Admitted', 'Treated'],
    default: 'Waiting',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Patient', PatientSchema);
