const Patient = require('../models/Patient')
const { getIO } = require('../config/socket')

const ESCALATION_RULES = {
  3: { maxWaitMinutes: 30, escalateTo: 2 },
  2: { maxWaitMinutes: 20, escalateTo: 1 }
}

const PRIORITY_LABELS = {
  1: 'Critical',
  2: 'Urgent',
  3: 'Priority',
  4: 'Non-Urgent'
}

const checkEscalations = async () => {
  try {
    const waitingPatients = await Patient.find({
      status: 'Waiting',
      'aiTriage.priorityLevel': { $in: [2, 3] }
    })

    let escalatedCount = 0

    for (const patient of waitingPatients) {
      const currentLevel = patient.aiTriage.priorityLevel
      const rule = ESCALATION_RULES[currentLevel]
      
      if (!rule) continue

      const waitMinutes = Math.floor(
        (Date.now() - patient.createdAt) / 60000
      )

      if (waitMinutes >= rule.maxWaitMinutes) {
        const newLevel = rule.escalateTo
        const newLabel = PRIORITY_LABELS[newLevel]

        await Patient.findByIdAndUpdate(
          patient._id,
          {
            'aiTriage.priorityLevel': newLevel,
            'aiTriage.priorityLabel': newLabel,
            $push: {
              timeline: {
                status: 'Escalated',
                timestamp: new Date(),
                updatedBy: 'System',
                note: `Priority escalated from ${PRIORITY_LABELS[currentLevel]} to ${newLabel} after waiting ${waitMinutes} minutes`
              }
            }
          }
        )

        getIO().emit('patientEscalated', {
          patientId: patient._id,
          patientName: patient.name,
          age: patient.age,
          oldLevel: currentLevel,
          oldLabel: PRIORITY_LABELS[currentLevel],
          newLevel: newLevel,
          newLabel: newLabel,
          waitMinutes: waitMinutes,
          department: patient.aiTriage.department,
          hospitalName: patient.hospitalName,
          message: ` ${patient.name} escalated to ${newLabel} after ${waitMinutes} minutes wait time`
        })

        escalatedCount++
        console.log(` ESCALATED: ${patient.name} Level ${currentLevel} → ${newLevel} Wait: ${waitMinutes} mins`)
      }
    }

    if (escalatedCount > 0) {
      console.log(` Escalation check complete. ${escalatedCount} patients escalated.`)
    }

  } catch (error) {
    console.error(" Escalation error:", error.message)
  }
}

const startEscalationService = () => {
  console.log("   Escalation service started (Checking every 5 mins)")
  
  checkEscalations()
  
  setInterval(checkEscalations, 5 * 60 * 1000)
}

module.exports = { 
  startEscalationService,
  checkEscalations 
}
