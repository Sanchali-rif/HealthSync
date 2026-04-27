const express = require('express')
const router = express.Router()
const Patient = require('../models/Patient')
const Hospital = require('../models/Hospital')
const { verifyFirebaseToken } = require('../middleware/authMiddleware')
const { requireDoctor } = require('../middleware/roleMiddleware')

// ROUTE 1: GET /dashboard
router.get('/dashboard', verifyFirebaseToken, requireDoctor, async (req, res) => {
  try {
    const hospitalId = req.user.hospitalId
    const { range = "today" } = req.query

    const now = new Date()
    let startDate = new Date()
    
    if (range === "week") {
      startDate.setDate(now.getDate() - 7)
      startDate.setHours(0, 0, 0, 0)
    } else if (range === "month") {
      startDate.setDate(now.getDate() - 30)
      startDate.setHours(0, 0, 0, 0)
    } else {
      startDate.setHours(0, 0, 0, 0)
    }

    const baseFilter = {
      createdAt: { $gte: startDate }
    }
    if (hospitalId) {
      baseFilter.hospitalId = hospitalId
    }

    const patients = await Patient.find(baseFilter)

    const totalPatients = patients.length
    
    const byStatus = {
      waiting: patients.filter(p => p.status === 'Waiting').length,
      admitted: patients.filter(p => p.status === 'Admitted').length,
      treated: patients.filter(p => p.status === 'Treated').length
    }

    const byPriority = {
      critical: patients.filter(p => p.aiTriage?.priorityLevel === 1).length,
      urgent: patients.filter(p => p.aiTriage?.priorityLevel === 2).length,
      priority: patients.filter(p => p.aiTriage?.priorityLevel === 3).length,
      nonUrgent: patients.filter(p => p.aiTriage?.priorityLevel === 4).length
    }

    const waitTimes = patients
      .filter(p => p.status !== 'Waiting')
      .map(p => {
        const admitted = p.timeline?.find(
          t => t.status === 'Admitted'
        )
        if (!admitted) return null
        return Math.floor(
          (new Date(admitted.timestamp) - new Date(p.createdAt)) / 60000
        )
      })
      .filter(t => t !== null)

    const avgWaitTime = waitTimes.length > 0
      ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
      : 0

    const maxWaitTime = waitTimes.length > 0
      ? Math.max(...waitTimes)
      : 0

    const minWaitTime = waitTimes.length > 0
      ? Math.min(...waitTimes)
      : 0

    const departmentMap = {}
    patients.forEach(p => {
      const dept = p.aiTriage?.department || 'Unknown'
      if (!departmentMap[dept]) {
        departmentMap[dept] = {
          department: dept,
          total: 0,
          critical: 0,
          admitted: 0,
          treated: 0,
          waiting: 0
        }
      }
      departmentMap[dept].total++
      if (p.aiTriage?.priorityLevel === 1) departmentMap[dept].critical++
      if (p.status === 'Admitted') departmentMap[dept].admitted++
      if (p.status === 'Treated') departmentMap[dept].treated++
      if (p.status === 'Waiting') departmentMap[dept].waiting++
    })
    const byDepartment = Object.values(departmentMap).sort((a, b) => b.total - a.total)

    const hourlyFlow = Array(24).fill(0).map((_, hour) => ({
      hour: hour,
      label: hour + ":00",
      count: patients.filter(p => {
        const patientHour = new Date(p.createdAt).getHours()
        return patientHour === hour
      }).length
    }))

    const peakHour = hourlyFlow.reduce(
      (max, h) => h.count > max.count ? h : max,
      hourlyFlow[0]
    )

    const byGender = {
      male: patients.filter(p => p.gender?.toLowerCase() === 'male').length,
      female: patients.filter(p => p.gender?.toLowerCase() === 'female').length,
      other: patients.filter(p => p.gender?.toLowerCase() === 'other').length
    }

    const byAgeGroup = {
      child: patients.filter(p => p.age < 18).length,
      adult: patients.filter(p => p.age >= 18 && p.age < 60).length,
      senior: patients.filter(p => p.age >= 60).length
    }

    const escalatedCount = patients.filter(p =>
      p.timeline?.some(t => t.status === 'Escalated')
    ).length

    const transferredCount = patients.filter(p =>
      p.timeline?.some(t => t.status === 'Transferred')
    ).length

    const hospitals = await Hospital.find({ isActive: true })

    const networkStats = {
      totalHospitals: hospitals.length,
      totalBeds: hospitals.reduce((sum, h) => sum + h.totalBeds, 0),
      totalAvailable: hospitals.reduce((sum, h) => sum + h.availableBeds, 0),
      totalOccupied: hospitals.reduce((sum, h) => sum + h.occupiedBeds, 0),
      criticalHospitals: hospitals.filter(h => h.capacity === 'Critical').length,
      networkOccupancy: hospitals.length > 0 && hospitals.reduce((sum, h) => sum + h.totalBeds, 0) > 0 
        ? Math.round(
            (hospitals.reduce((sum, h) => sum + h.occupiedBeds, 0) / 
             hospitals.reduce((sum, h) => sum + h.totalBeds, 0)) * 100
          )
        : 0
    }

    const hospitalBreakdown = hospitals.map(h => ({
      id: h._id,
      name: h.name,
      totalBeds: h.totalBeds,
      availableBeds: h.availableBeds,
      occupiedBeds: h.occupiedBeds,
      capacity: h.capacity,
      occupancyRate: h.totalBeds > 0 ? Math.round((h.occupiedBeds / h.totalBeds) * 100) : 0,
      specializations: h.specializations
    }))

    return res.status(200).json({
      range: range,
      generatedAt: new Date(),
      overview: {
        totalPatients,
        byStatus,
        byPriority,
        escalatedCount,
        transferredCount
      },
      waitTime: {
        average: avgWaitTime,
        max: maxWaitTime,
        min: minWaitTime,
        unit: "minutes"
      },
      byDepartment,
      hourlyFlow,
      peakHour: {
        hour: peakHour.hour,
        label: peakHour.label,
        count: peakHour.count
      },
      byGender,
      byAgeGroup,
      network: networkStats,
      hospitals: hospitalBreakdown
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

// ROUTE 2: GET /patients/history
router.get('/patients/history', verifyFirebaseToken, requireDoctor, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10,
      status,
      department,
      priority
    } = req.query

    const hospitalId = req.user.hospitalId

    const filter = {}
    if (hospitalId) filter.hospitalId = hospitalId
    if (status) filter.status = status
    if (department) filter['aiTriage.department'] = department
    if (priority) filter['aiTriage.priorityLevel'] = parseInt(priority)

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const patients = await Patient.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Patient.countDocuments(filter)

    return res.status(200).json({
      patients,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

// ROUTE 3: GET /hospitals/performance
router.get('/hospitals/performance', verifyFirebaseToken, async (req, res) => {
  try {
    const { range = "today" } = req.query

    const now = new Date()
    let startDate = new Date()
    
    if (range === "week") {
      startDate.setDate(now.getDate() - 7)
      startDate.setHours(0, 0, 0, 0)
    } else if (range === "month") {
      startDate.setDate(now.getDate() - 30)
      startDate.setHours(0, 0, 0, 0)
    } else {
      startDate.setHours(0, 0, 0, 0)
    }

    const hospitals = await Hospital.find({ isActive: true })

    const hospitalMetrics = await Promise.all(
      hospitals.map(async (hospital) => {
        const hospitalPatients = await Patient.find({
          hospitalId: hospital._id,
          createdAt: { $gte: startDate }
        })

        const admittedPatients = hospitalPatients.filter(
          p => p.status === 'Admitted' || p.status === 'Treated'
        )

        const waitTimes = admittedPatients
          .map(p => {
            const admitted = p.timeline?.find(
              t => t.status === 'Admitted'
            )
            if (!admitted) return null
            return Math.floor(
              (new Date(admitted.timestamp) - new Date(p.createdAt)) / 60000
            )
          })
          .filter(t => t !== null)

        const avgWait = waitTimes.length > 0
          ? Math.round(
              waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length
            )
          : 0

        return {
          hospitalId: hospital._id,
          name: hospital.name,
          totalBeds: hospital.totalBeds,
          availableBeds: hospital.availableBeds,
          occupancyRate: hospital.totalBeds > 0 ? Math.round(
            (hospital.occupiedBeds / hospital.totalBeds) * 100
          ) : 0,
          capacity: hospital.capacity,
          patientsToday: hospitalPatients.length,
          criticalToday: hospitalPatients.filter(
            p => p.aiTriage?.priorityLevel === 1
          ).length,
          admittedToday: admittedPatients.length,
          avgWaitTime: avgWait,
          specializations: hospital.specializations
        }
      })
    )

    return res.status(200).json({
      range,
      hospitals: hospitalMetrics,
      generatedAt: new Date()
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

module.exports = router
