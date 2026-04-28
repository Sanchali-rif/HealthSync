require('dotenv').config()

const admin = require('firebase-admin')

if (admin.apps.length === 0) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY

  console.log("Loading Firebase with project:", 
    process.env.FIREBASE_PROJECT_ID)
  console.log("Private key found:", !!privateKey)

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey 
        ? privateKey.replace(/\\n/g, '\n')
        : undefined
    })
  })
}

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Unauthorized: No token provided' 
    })
  }

  const token = authHeader.split('Bearer ')[1]

  try {
    const decodedToken = await admin.auth()
      .verifyIdToken(token)

    const userRecord = await admin.auth()
      .getUser(decodedToken.uid)

    const claims = userRecord.customClaims || {}

    req.user = {
      ...decodedToken,
      role: claims.role || decodedToken.role,
      hospitalId: claims.hospitalId || null,
      hospitalName: claims.hospitalName || null
    }

    next()
  } catch (error) {
    return res.status(401).json({ 
      error: 'Unauthorized: Invalid or expired token' 
    })
  }
}

module.exports = { verifyFirebaseToken }
