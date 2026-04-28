require('dotenv').config();
const mongoose = require('mongoose');
const Hospital = require('../models/Hospital');

const seedHospitals = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    await Hospital.deleteMany({});

    const h1 = {
      name: "City General Hospital",
      location: {
        address: "1 Medical Drive",
        city: "Downtown",
        coordinates: { lat: 22.5726, lng: 88.3639 }
      },
      totalBeds: 100,
      availableBeds: 0,
      occupiedBeds: 100,
      capacity: "Critical",
      specializations: [
        "Cardiology", "Trauma", "Neurology",
        "Emergency", "ICU"
      ]
    };

    const h2 = {
      name: "Northside Medical Center",
      location: {
        address: "45 North Avenue",
        city: "Northside",
        coordinates: { lat: 22.5958, lng: 88.3699 }
      },
      totalBeds: 80,
      availableBeds: 5,
      occupiedBeds: 75,
      capacity: "High",
      specializations: [
        "Orthopaedics", "Paediatrics",
        "Gynaecology", "General OPD", "Respiratory"
      ]
    };

    const h3 = {
      name: "St. Jude's Medical Institute",
      location: {
        address: "99 South Park Road",
        city: "Southside",
        coordinates: { lat: 22.5414, lng: 88.3576 }
      },
      totalBeds: 120,
      availableBeds: 12,
      occupiedBeds: 108,
      capacity: "Moderate",
      specializations: [
        "Oncology", "Nephrology", "Cardiology",
        "Neurology", "Vascular Surgery", "ICU"
      ]
    };

    await Hospital.insertMany([h1, h2, h3]);

    console.log("3 Hospitals seeded successfully");
    const hospitals = await Hospital.find({});
    hospitals.forEach(h => {
      console.log(`- ${h.name} | Available Beds: ${h.availableBeds}`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding hospitals:", error);
    process.exit(1);
  }
};

seedHospitals();
