require('dotenv').config()

const admin = require('firebase-admin')
const axios = require('axios')

if (admin.apps.length === 0) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey
        ? privateKey.replace(/\\n/g, '\n')
        : undefined,
    }),
  })
}

// POST /register — create user in Firebase Auth with a role claim
const createUser = async (req, res) => {
  try {
    const { email, password, role } = req.body

    const userRecord = await admin.auth().createUser({ email, password })

    await admin.auth().setCustomUserClaims(userRecord.uid, { role: role })

    return res.status(201).json({
      uid: userRecord.uid,
      email: userRecord.email,
      role: role,
    })
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }
}

// POST /login — sign in via Firebase REST API, return token + role
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    const firebaseUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_WEB_API_KEY}`

    const response = await axios.post(firebaseUrl, {
      email,
      password,
      returnSecureToken: true,
    })

    const userRecord = await admin.auth().getUserByEmail(email)
    const role = userRecord.customClaims?.role || null

    if (!role) {
      return res.status(401).json({
        error: 'User has no role assigned. Please register first.',
      })
    }

    return res.status(200).json({
      token: response.data.idToken,
      refreshToken: response.data.refreshToken,
      expiresIn: response.data.expiresIn,
      uid: response.data.localId,
      email: response.data.email,
      role: role,
    })
  } catch (error) {
    const msg =
      error.response?.data?.error?.message || error.message
    return res.status(401).json({ error: msg })
  }
}

// POST /refresh — exchange a refresh token for a new ID token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body

    const firebaseUrl = `https://securetoken.googleapis.com/v1/token?key=${process.env.FIREBASE_WEB_API_KEY}`

    const response = await axios.post(firebaseUrl, {
      grant_type: 'refresh_token',
      refresh_token: token,
    })

    return res.status(200).json({
      token: response.data.id_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
    })
  } catch (error) {
    const msg =
      error.response?.data?.error?.message || error.message
    return res.status(401).json({ error: msg })
  }
}

// POST /google — verify Google ID token, check role, return session
const googleSignIn = async (req, res) => {
  try {
    const { idToken } = req.body

    const decodedToken = await admin.auth().verifyIdToken(idToken)
    const { uid, email, name, picture } = decodedToken

    const userRecord = await admin.auth().getUser(uid)
    const role = userRecord.customClaims?.role || null

    if (!role) {
      return res.status(200).json({
        needsRole: true,
        uid: uid,
        email: email,
        name: name,
        picture: picture,
      })
    }

    // Role exists — issue a custom token and return full session
    const customToken = await admin.auth().createCustomToken(uid)

    return res.status(200).json({
      token: idToken,
      uid: uid,
      email: email,
      name: name,
      picture: picture,
      role: role,
    })
  } catch (error) {
    return res.status(401).json({ error: error.message })
  }
}

// POST /assign-role — set a Firebase custom claim role for a user
const assignRole = async (req, res) => {
  try {
    const { uid, role } = req.body

    if (role !== 'Nurse' && role !== 'Doctor') {
      return res.status(400).json({ error: 'Role must be Nurse or Doctor' })
    }

    await admin.auth().setCustomUserClaims(uid, { role })

    return res.status(200).json({ message: 'Role assigned', uid, role })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

module.exports = {
  createUser,
  loginUser,
  refreshToken,
  googleSignIn,
  assignRole,
}
