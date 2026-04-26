const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  location: {
    address: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  totalBeds: {
    type: Number,
    required: true,
    default: 50
  },
  availableBeds: {
    type: Number,
    required: true,
    default: 50
  },
  occupiedBeds: {
    type: Number,
    required: true,
    default: 0
  },
  capacity: {
    type: String,
    enum: ["Low", "Moderate", "High", "Critical"],
    default: "Low"
  },
  specializations: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Hospital = mongoose.model('Hospital', hospitalSchema);

module.exports = Hospital;
