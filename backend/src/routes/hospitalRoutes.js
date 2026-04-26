const express = require('express')
const router = express.Router()
const { verifyFirebaseToken } = require('../middleware/authMiddleware')
const Hospital = require('../models/Hospital')
const { getIO } = require('../config/socket')


// Route 1 - Network overview (MUST be before /:id)
router.get('/network/overview', verifyFirebaseToken, async (req, res) => {
  try {
    const hospitals = await Hospital.find({ isActive: true })

    const totalBeds = hospitals.reduce((sum, h) => sum + h.totalBeds, 0)
    const totalAvailable = hospitals.reduce((sum, h) => sum + h.availableBeds, 0)
    const totalOccupied = hospitals.reduce((sum, h) => sum + h.occupiedBeds, 0)
    const criticalHospitals = hospitals.filter(h => h.capacity === 'Critical').length

    const hospitalsWithRate = hospitals.map(h => ({
      ...h._doc,
      occupancyRate: Math.round((h.occupiedBeds / h.totalBeds) * 100)
    }))

    return res.status(200).json({
      hospitals: hospitalsWithRate,
      network: {
        totalBeds,
        totalAvailable,
        totalOccupied,
        criticalHospitals,
        totalHospitals: hospitals.length
      }
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

// Route 2 - Get all hospitals
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const hospitals = await Hospital.find({ isActive: true })
      .sort({ availableBeds: -1 })
    return res.status(200).json(hospitals)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

// Route 3 - Create a new hospital
router.post('/', verifyFirebaseToken, async (req, res) => {
  try {
    const newHospital = new Hospital(req.body)
    const savedHospital = await newHospital.save()
    return res.status(201).json(savedHospital)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

// Route 4 - Update beds
router.patch('/:id/beds', verifyFirebaseToken, async (req, res) => {
  try {
    console.log("=== BED UPDATE REQUEST ===")
    console.log("Hospital ID:", req.params.id)
    console.log("Action:", req.body.action)

    const { action } = req.body
    const hospital = await Hospital.findById(
      req.params.id
    )

    console.log("Hospital found:", 
      hospital ? hospital.name : "NOT FOUND")
    console.log("Current available beds:", 
      hospital?.availableBeds)
    console.log("Current occupied beds:", 
      hospital?.occupiedBeds)

    if (!hospital) {
      return res.status(404).json({ 
        error: 'Hospital not found' 
      })
    }

    if (action === 'occupy') {
      if (hospital.availableBeds === 0) {
        return res.status(400).json({ 
          error: 'No beds available' 
        })
      }
      hospital.availableBeds -= 1
      hospital.occupiedBeds += 1
    } else if (action === 'free') {
      hospital.availableBeds += 1
      hospital.occupiedBeds -= 1
    } else {
      return res.status(400).json({
        error: "Action must be occupy or free"
      })
    }

    console.log("New available beds:", 
      hospital.availableBeds)
    console.log("New occupied beds:", 
      hospital.occupiedBeds)

    const occupancyRate = 
      (hospital.occupiedBeds / hospital.totalBeds) * 100
    
    if (occupancyRate >= 95) 
      hospital.capacity = 'Critical'
    else if (occupancyRate >= 80) 
      hospital.capacity = 'High'
    else if (occupancyRate >= 50) 
      hospital.capacity = 'Moderate'
    else 
      hospital.capacity = 'Low'

    const updatedHospital = await hospital.save()
    
    console.log("Saved successfully:", 
      updatedHospital.availableBeds)
    console.log("==========================")

    getIO().emit('hospitalUpdated', updatedHospital)

    return res.status(200).json(updatedHospital)

  } catch (error) {
    console.log("BED UPDATE ERROR:", error.message)
    return res.status(500).json({ 
      error: error.message 
    })
  }
})

// Route 5 - Get single hospital (LAST - after all specific routes)
router.get('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id)
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' })
    }
    return res.status(200).json(hospital)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

module.exports = router
