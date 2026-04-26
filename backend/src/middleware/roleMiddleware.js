// requireNurse — only allows requests where req.user.role === "Nurse"
// req.user is populated by verifyFirebaseToken from Firebase custom claims
const requireNurse = (req, res, next) => {
  const role = req.user.role || req.user.customClaims?.role || null;
  if (role !== 'Nurse') {
    return res.status(403).json({ error: 'Access denied. Nurses only.' })
  }
  next()
}

// requireDoctor — only allows requests where req.user.role === "Doctor"
const requireDoctor = (req, res, next) => {
  const role = req.user.role || req.user.customClaims?.role || null;
  if (role !== 'Doctor') {
    return res.status(403).json({ error: 'Access denied. Doctors only.' })
  }
  next()
}

module.exports = { requireNurse, requireDoctor }
