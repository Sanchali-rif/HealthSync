const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  patientId: { type: String },
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
    suggestedHospital: { type: String },
    dispatchReason: { type: String },
  },
  status: {
    type: String,
    enum: ['Waiting', 'Admitted', 'Treated'],
    default: 'Waiting',
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    default: null
  },
  hospitalName: {
    type: String,
    default: null
  },
  suggestedHospital: {
    type: String,
    default: null
  },
  dispatchReason: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Patient', PatientSchema);
