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

// POST /google — verify Google ID token, check/assign role, return session
const googleSignIn = async (req, res) => {
  try {
    const { idToken, role: requestedRole } = req.body

    // 1. Validate role if one was provided in the request body
    if (requestedRole !== undefined && requestedRole !== 'Nurse' && requestedRole !== 'Doctor') {
      return res.status(400).json({ error: 'Role must be Nurse or Doctor' })
    }

    // 2. Verify the Google ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    const { uid, email, name, picture } = decodedToken

    // 3. Fetch the user record to inspect existing custom claims
    let userRecord = await admin.auth().getUser(uid)
    const isNewUser = userRecord.metadata.creationTime === userRecord.metadata.lastSignInTime
    let existingRole = userRecord.customClaims?.role || null

    // 4. Determine final role
    let finalRole = existingRole

    if (!existingRole) {
      if (requestedRole) {
        // Role provided in request — assign it now
        await admin.auth().setCustomUserClaims(uid, { role: requestedRole })
        finalRole = requestedRole
      } else {
        // No existing role and none provided — ask the client to select one
        return res.status(200).json({
          needsRole: true,
          uid,
          email,
          name,
          picture,
        })
      }
    }

    // 5. Role is confirmed — return full session
    return res.status(200).json({
      token: idToken,
      refreshToken: decodedToken.refreshToken || null,
      uid,
      email,
      name,
      picture,
      role: finalRole,
      isNewUser,
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

const forgotPassword = async (req, res) => {
  const { email } = req.body
  
  console.log("=== FORGOT PASSWORD ===")
  console.log("Email received:", email)
  console.log("Firebase Web API Key exists:", 
    !!process.env.FIREBASE_WEB_API_KEY)
  console.log("Key first 10 chars:", 
    process.env.FIREBASE_WEB_API_KEY
      ? process.env.FIREBASE_WEB_API_KEY
          .substring(0,10) + "..."
      : "MISSING")

  try {
    // Check user exists
    const userRecord = await admin.auth()
      .getUserByEmail(email)
    console.log("User found:", userRecord.uid)

    // Send reset email
    const resetResponse = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${process.env.FIREBASE_WEB_API_KEY}`,
      {
        requestType: "PASSWORD_RESET",
        email: email
      }
    )
    console.log("Reset email sent:", 
      resetResponse.data)

    return res.status(200).json({
      message: "Password reset email sent. Please check your inbox.",
      email: email
    })

  } catch (error) {
    console.log("=== FORGOT PASSWORD ERROR ===")
    console.log("Error message:", error.message)
    console.log("Error response:", 
      error.response?.data)
    console.log("==============================")

    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ 
        error: "No account found with this email" 
      })
    }

    return res.status(500).json({ 
      error: "Failed to send reset email. Please try again." 
    })
  }
};

const resetPassword = async (req, res) => {
  const { oobCode, newPassword } = req.body;
  if (!oobCode || !newPassword) {
    return res.status(400).json({ error: "Reset code and new password are required" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${process.env.FIREBASE_WEB_API_KEY}`, {
      oobCode: oobCode,
      newPassword: newPassword
    });

    return res.status(200).json({ message: "Password reset successful. You can now login with your new password." });
  } catch (error) {
    return res.status(400).json({ error: "Invalid or expired reset code. Please request a new password reset." });
  }
};

module.exports = {
  createUser,
  loginUser,
  refreshToken,
  googleSignIn,
  assignRole,
  forgotPassword,
  resetPassword,
}
