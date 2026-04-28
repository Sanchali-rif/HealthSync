require('dotenv').config();
const mongoose = require('mongoose');
const Hospital = require('./src/models/Hospital');
const Patient = require('./src/models/Patient');

const resetDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    await Patient.deleteMany({});
    
    await Hospital.updateMany({}, {
      $set: {
        totalBeds: 10,
        availableBeds: 10,
        occupiedBeds: 0,
        capacity: 'Moderate'
      }
    });

    console.log('Database reset: All patients cleared and hospitals set to 10 beds.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error resetting DB:', error);
    process.exit(1);
  }
};

resetDB();
