const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')

// POST /api/auth/register — create new user with role
router.post('/register', authController.createUser)

// POST /api/auth/login — sign in with email + password
router.post('/login', authController.loginUser)

// POST /api/auth/refresh — exchange refresh token for new ID token
router.post('/refresh', authController.refreshToken)

// POST /api/auth/google — verify Google OAuth token
router.post('/google', authController.googleSignIn)

// POST /api/auth/assign-role — assign Nurse or Doctor role to a user
router.post('/assign-role', authController.assignRole)

// POST /api/auth/forgot-password - send password reset email
router.post('/forgot-password', authController.forgotPassword)

// POST /api/auth/reset-password - reset password using oobCode
router.post('/reset-password', authController.resetPassword)

module.exports = router
