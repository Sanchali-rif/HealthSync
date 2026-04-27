const express = require('express')
const router = express.Router()
const Hospital = require('../models/Hospital')
const { getDispatchRecommendation } = 
  require('../services/dispatchAI')
const { getIO } = require('../config/socket')

// ROUTE 1 - Get live hospital data (PUBLIC)
router.get('/hospitals/live', async (req, res) => {
  try {
    const hospitals = await Hospital.find({ 
      isActive: true 
    })

    const mapped = hospitals.map(h => ({
      id: h._id,
      name: h.name,
      availableBeds: h.availableBeds,
      totalBeds: h.totalBeds,
      occupiedBeds: h.occupiedBeds,
      capacity: h.capacity,
      wait_time_mins: Math.floor(
        (h.occupiedBeds / h.totalBeds) * 120
      ),
      occupancyRate: Math.round(
        (h.occupiedBeds / h.totalBeds) * 100
      ),
      specializations: h.specializations,
      status: h.capacity === 'Critical'
        ? 'CRITICAL'
        : h.capacity === 'High'
        ? 'HIGH LOAD'
        : 'OPERATIONAL'
    }))

    return res.status(200).json(mapped)

  } catch (error) {
    return res.status(500).json({ 
      error: error.message 
    })
  }
})

// ROUTE 2 - Generate dispatch recommendation (PUBLIC)
router.post('/route', async (req, res) => {
  try {
    const { incident, severity, hospitals } = req.body

    if (!incident) {
      return res.status(400).json({ 
        error: "Incident description is required" 
      })
    }

    if (!severity) {
      return res.status(400).json({ 
        error: "Severity level is required" 
      })
    }

    let hospitalData = hospitals

    if (!hospitalData || hospitalData.length === 0) {
      const dbHospitals = await Hospital.find({ 
        isActive: true 
      })
      hospitalData = dbHospitals.map(h => ({
        name: h.name,
        availableBeds: h.availableBeds,
        wait_time_mins: Math.floor(
          (h.occupiedBeds / h.totalBeds) * 120
        )
      }))
    }

    const result = await getDispatchRecommendation(
      incident,
      severity,
      hospitalData
    )

    getIO().emit('dispatchRecommendation', result)

    return res.status(200).json({
      success: true,
      incident: incident,
      severity: severity,
      terminal_logs: result.terminal_logs,
      recommendation: result.recommendation
    })

  } catch (error) {
    console.error("Dispatch route error:", error.message)
    return res.status(500).json({ 
      error: error.message 
    })
  }
})

// ROUTE 3 - Confirm ambulance dispatch (PUBLIC)
router.post('/dispatch', async (req, res) => {
  try {
    const { hospitalName } = req.body

    if (!hospitalName) {
      return res.status(400).json({ 
        error: "Hospital name is required" 
      })
    }

    const hospital = await Hospital.findOne({ 
      name: hospitalName, 
      isActive: true 
    })

    if (!hospital) {
      return res.status(404).json({ 
        error: "Hospital not found: " + hospitalName 
      })
    }

    if (hospital.availableBeds === 0) {
      return res.status(400).json({ 
        error: hospitalName + " has no available beds" 
      })
    }

    hospital.availableBeds -= 1
    hospital.occupiedBeds += 1

    const rate = (hospital.occupiedBeds / 
      hospital.totalBeds) * 100
    if (rate >= 95) hospital.capacity = 'Critical'
    else if (rate >= 80) hospital.capacity = 'High'
    else if (rate >= 50) hospital.capacity = 'Moderate'
    else hospital.capacity = 'Low'

    const updated = await hospital.save()

    getIO().emit('hospitalUpdated', updated)
    
    getIO().emit('ambulanceDispatched', {
      hospitalName: hospitalName,
      remainingBeds: updated.availableBeds,
      capacity: updated.capacity,
      dispatchedAt: new Date()
    })

    return res.status(200).json({
      success: true,
      message: "Ambulance dispatched to " 
        + hospitalName,
      hospital: {
        name: updated.name,
        availableBeds: updated.availableBeds,
        occupiedBeds: updated.occupiedBeds,
        capacity: updated.capacity,
        occupancyRate: Math.round(rate)
      }
    })

  } catch (error) {
    console.error("Dispatch confirm error:", 
      error.message)
    return res.status(500).json({ 
      error: error.message 
    })
  }
})

module.exports = router
