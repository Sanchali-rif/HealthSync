const mongoose = require('mongoose');
const Patient = require('./src/models/Patient');
const Hospital = require('./src/models/Hospital');
require('dotenv').config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const patientId = "some-id-we-need";
    const patients = await Patient.find({ status: 'Waiting' });
    console.log(`Found ${patients.length} waiting patients`);

    if (patients.length === 0) return;

    const patient = patients[0];
    
    // Simulate patch route
    const status = 'Admitted';
    const oldPatient = await Patient.findById(patient._id);
    
    const updatedPatient = await Patient.findByIdAndUpdate(
      patient._id,
      {
        status: status,
        $push: {
          timeline: {
            status: status,
            timestamp: new Date(),
            updatedBy: 'tester',
            note: ''
          }
        }
      },
      { new: true }
    );
    
    const wasAdmitted = oldPatient.status === 'Admitted';
    const isAdmitting = status === 'Admitted';
    
    if (!wasAdmitted && isAdmitting && updatedPatient.hospitalId) {
      const targetHospital = await Hospital.findById(updatedPatient.hospitalId);
      if (targetHospital && targetHospital.availableBeds > 0) {
        await Hospital.findByIdAndUpdate(updatedPatient.hospitalId, {
          $inc: { availableBeds: -1, occupiedBeds: 1 }
        });
      }
      console.log('Hospital updated:', targetHospital);
    }
  } catch (e) {
    console.error('Error during test:', e);
  } finally {
    process.exit(0);
  }
}
run();
