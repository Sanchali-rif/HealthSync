const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/authMiddleware');
const { requireNurse, requireDoctor } = require('../middleware/roleMiddleware');
const Patient = require('../models/Patient');
const Hospital = require('../models/Hospital');
const getAITriage = require('../services/triageAI');
const { getIO } = require('../config/socket');

// POST /triage — register new patient, run AI triage, broadcast to dashboard
router.post('/triage', verifyFirebaseToken, requireNurse, async (req, res) => {
  try {
    const { patientId, name, age, gender, vitals, complaint, hospitalId, manualTriage } = req.body;

    const hospitals = await Hospital.find({ isActive: true });

    let aiTriage;
    if (manualTriage) {
      aiTriage = manualTriage;
    } else {
      aiTriage = await getAITriage({ age, complaint, vitals }, hospitals);
    }

    const suggestedHospital = hospitals.find(
      h => h.name === aiTriage.suggestedHospital
    );

    const nurseHospitalId = req.user.hospitalId || null;
    const nurseHospitalName = req.user.hospitalName || null;

    const newPatient = new Patient({
      patientId,
      name,
      age,
      gender,
      vitals,
      complaint,
      aiTriage,
      hospitalId: nurseHospitalId || suggestedHospital?._id || null,
      hospitalName: nurseHospitalName || suggestedHospital?.name || null,
      suggestedHospital: aiTriage.suggestedHospital,
      dispatchReason: aiTriage.dispatchReason,
      status: 'Waiting'
    });

    const savedPatient = await newPatient.save();

    await Patient.findByIdAndUpdate(
      savedPatient._id,
      {
        $push: {
          timeline: {
            status: 'Registered',
            timestamp: new Date(),
            updatedBy: req.user.email,
            note: 'Patient registered and triaged by AI'
          }
        }
      }
    );

    getIO().emit('newPatient', savedPatient);

    if (savedPatient.aiTriage.priorityLevel === 1) {
      getIO().emit('criticalPatientAlert', {
        patientId: savedPatient._id,
        patientName: savedPatient.name,
        age: savedPatient.age,
        gender: savedPatient.gender,
        complaint: savedPatient.complaint,
        department: savedPatient.aiTriage.department,
        justification: 
          savedPatient.aiTriage.justification,
        hospitalName: savedPatient.hospitalName 
          || 'Unassigned',
        suggestedHospital: 
          savedPatient.suggestedHospital,
        vitals: savedPatient.vitals,
        timestamp: new Date()
      })
      
      console.log("🚨 CRITICAL ALERT FIRED:", 
        savedPatient.name,
        "→", savedPatient.aiTriage.department)
    }

    return res.status(201).json(savedPatient);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /active — fetch all Waiting patients sorted by AI priority (1 = most critical)
router.get('/active', verifyFirebaseToken, requireDoctor, async (req, res) => {
  try {
    const doctorHospitalId = req.user.hospitalId || null;
    const { department } = req.query;

    const filter = { status: { $in: ['Waiting', 'Admitted'] } };

    if (doctorHospitalId) {
      filter.hospitalId = doctorHospitalId;
    }

    if (department && department !== 'All Departments') {
      filter['aiTriage.department'] = department;
    }

    const patients = await Patient.find(filter).sort({
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

    const oldPatient = await Patient.findById(patientId);
    if (!oldPatient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const updatedPatient = await Patient.findByIdAndUpdate(
      patientId,
      {
        status: status,
        $push: {
          timeline: {
            status: status,
            timestamp: new Date(),
            updatedBy: req.user.email,
            note: req.body.note || ''
          }
        }
      },
      { new: true }
    );

    const wasAdmitted = oldPatient.status === 'Admitted';
    const isAdmitting = status === 'Admitted';
    const isDischarging = status === 'Treated' || status === 'Discharged';

    if (!wasAdmitted && isAdmitting && updatedPatient.hospitalId) {
      const targetHospital = await Hospital.findById(updatedPatient.hospitalId);
      if (targetHospital && targetHospital.availableBeds > 0) {
        await Hospital.findByIdAndUpdate(updatedPatient.hospitalId, {
          $inc: { availableBeds: -1, occupiedBeds: 1 }
        });
      }
      getIO().emit("hospitalUpdated", await Hospital.findById(updatedPatient.hospitalId));
    } else if (wasAdmitted && isDischarging && updatedPatient.hospitalId) {
      await Hospital.findByIdAndUpdate(updatedPatient.hospitalId, {
        $inc: { availableBeds: 1, occupiedBeds: -1 }
      });
      getIO().emit("hospitalUpdated", await Hospital.findById(updatedPatient.hospitalId));
    }

    if (isDischarging) {
      getIO().emit('patientRemoved', { id: patientId });
    } else {
      getIO().emit('patientUpdated', updatedPatient);
    }

    if (status === 'Admitted') {
      getIO().emit('patientAdmitted', {
        patientId: patientId,
        patientName: updatedPatient.name,
        hospitalName: updatedPatient.hospitalName,
        department: updatedPatient.aiTriage?.department,
        admittedAt: new Date()
      })
      console.log("✅ Patient admitted:", 
        updatedPatient.name)
    }

    return res.status(200).json(updatedPatient);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /stats
router.get('/stats', verifyFirebaseToken, requireDoctor, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { hospitalId } = req.query;

    const baseFilter = { 
      createdAt: { $gte: today } 
    };

    if (hospitalId) {
      baseFilter.hospitalId = hospitalId;
    }

    const patients = await Patient.find(baseFilter);

    const totalPatients = patients.length;
    
    const critical = patients.filter(p => 
      p.aiTriage?.priorityLevel === 1).length;
    
    const urgent = patients.filter(p => 
      p.aiTriage?.priorityLevel === 2).length;
    
    const admitted = patients.filter(p => 
      p.status === 'Admitted').length;
    
    const treated = patients.filter(p => 
      p.status === 'Treated').length;
    
    const waiting = patients.filter(p => 
      p.status === 'Waiting').length;

    const avgWaitTime = patients.length > 0
      ? Math.round(
          patients.reduce((sum, p) => {
            const mins = Math.floor(
              (Date.now() - p.createdAt) / 60000
            );
            return sum + mins;
          }, 0) / patients.length
        )
      : 0;

    const byDepartment = patients.reduce(
      (acc, p) => {
        const dept = p.aiTriage?.department || 'Unknown';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {}
    );

    const byPriorityLabel = {
      Critical: patients.filter(p => 
        p.aiTriage?.priorityLevel === 1).length,
      Urgent: patients.filter(p => 
        p.aiTriage?.priorityLevel === 2).length,
      Priority: patients.filter(p => 
        p.aiTriage?.priorityLevel === 3).length,
      NonUrgent: patients.filter(p => 
        p.aiTriage?.priorityLevel === 4).length
    };

    return res.status(200).json({
      today: {
        totalPatients,
        critical,
        urgent,
        admitted,
        treated,
        waiting,
        avgWaitTime
      },
      byDepartment: Object.entries(byDepartment)
        .map(([department, count]) => ({
          department,
          count
        }))
        .sort((a, b) => b.count - a.count),
      byPriority: byPriorityLabel
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /:id/notes
router.post('/:id/notes', verifyFirebaseToken, requireDoctor, async (req, res) => {
  try {
    if (!req.body.note) {
      return res.status(400).json({ error: "Note text is required" });
    }

    const updated = await Patient.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          notes: {
            text: req.body.note,
            addedBy: req.user.email,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Patient not found" });
    }

    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /:id
router.get('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    return res.status(200).json(patient);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
