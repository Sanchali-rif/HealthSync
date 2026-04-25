const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/authMiddleware');
const { requireNurse, requireDoctor } = require('../middleware/roleMiddleware');
const Patient = require('../models/Patient');
const getAITriage = require('../services/triageAI');
const { getIO } = require('../config/socket');

// POST /triage — register new patient, run AI triage, broadcast to dashboard
router.post('/triage', verifyFirebaseToken, requireNurse, async (req, res) => {
  try {
    const { name, age, gender, vitals, complaint } = req.body;

    const aiTriage = await getAITriage({ age, complaint, vitals });

    const newPatient = new Patient({ name, age, gender, vitals, complaint, aiTriage });
    const savedPatient = await newPatient.save();

    getIO().emit('newPatient', savedPatient);

    return res.status(201).json(savedPatient);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /active — fetch all Waiting patients sorted by AI priority (1 = most critical)
router.get('/active', verifyFirebaseToken, requireDoctor, async (req, res) => {
  try {
    const patients = await Patient.find({ status: 'Waiting' }).sort({
      'aiTriage.priorityLevel': 1,
    });

    return res.status(200).json(patients);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH /:id/status — update patient status and notify connected clients
router.patch('/:id/status', verifyFirebaseToken, requireDoctor, async (req, res) => {
  try {
    const patientId = req.params.id;
    const { status } = req.body;

    const updatedPatient = await Patient.findByIdAndUpdate(
      patientId,
      { status },
      { new: true }
    );

    if (!updatedPatient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    getIO().emit('patientRemoved', { id: patientId });

    return res.status(200).json(updatedPatient);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
