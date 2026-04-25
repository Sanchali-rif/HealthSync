// requireNurse — only allows requests where req.user.role === "Nurse"
// req.user is populated by verifyFirebaseToken from Firebase custom claims
const requireNurse = (req, res, next) => {
  if (req.user.role !== 'Nurse') {
    return res.status(403).json({ error: 'Access denied. Nurses only.' })
  }
  next()
}

// requireDoctor — only allows requests where req.user.role === "Doctor"
const requireDoctor = (req, res, next) => {
  if (req.user.role !== 'Doctor') {
    return res.status(403).json({ error: 'Access denied. Doctors only.' })
  }
  next()
}

module.exports = { requireNurse, requireDoctor }
