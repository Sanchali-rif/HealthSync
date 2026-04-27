const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const patients = await mongoose.connection.db
    .collection('patients')
    .find({ status: 'Waiting' })
    .toArray();

  console.log(`\nTotal Waiting patients: ${patients.length}\n`);
  patients.forEach(p => {
    console.log(`Name: ${p.name}`);
    console.log(`  hospitalId: ${p.hospitalId}`);
    console.log(`  hospitalName: ${p.hospitalName}`);
    console.log(`  status: ${p.status}`);
    console.log('---');
  });
  process.exit(0);
});
