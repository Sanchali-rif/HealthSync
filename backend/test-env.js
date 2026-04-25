require('dotenv').config();
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const { VertexAI } = require('@google-cloud/vertexai');

const checkEnv = (name, value, truncateLength = null) => {
  if (!value) {
    console.log(`❌ MISSING: ${name}`);
  } else {
    let displayValue = value;
    if (truncateLength && value.length > truncateLength) {
      displayValue = value.substring(0, truncateLength) + '...';
    }
    console.log(`✅ FOUND: ${name} = ${displayValue}`);
  }
};

console.log('--- Environment Variables ---');
checkEnv('PORT', process.env.PORT);
checkEnv('MONGO_URI', process.env.MONGO_URI, 20);
checkEnv('FIREBASE_PROJECT_ID', process.env.FIREBASE_PROJECT_ID);
checkEnv('FIREBASE_CLIENT_EMAIL', process.env.FIREBASE_CLIENT_EMAIL);
checkEnv('FIREBASE_PRIVATE_KEY', process.env.FIREBASE_PRIVATE_KEY, 20);
checkEnv('FIREBASE_WEB_API_KEY', process.env.FIREBASE_WEB_API_KEY, 10);
checkEnv('VERTEX_PROJECT_ID', process.env.VERTEX_PROJECT_ID);
checkEnv('VERTEX_LOCATION', process.env.VERTEX_LOCATION);
checkEnv('VERTEX_MODEL', process.env.VERTEX_MODEL);
console.log('');

const main = async () => {
  // TEST 1: MongoDB
  try {
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('MongoDB: Connected successfully');
      await mongoose.disconnect();
    } else {
      console.log('MongoDB: Missing MONGO_URI');
    }
  } catch (error) {
    console.log('MongoDB: ' + error.message);
  }

  // TEST 2: Firebase Admin
  try {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
        });
      }
      await admin.auth().listUsers(1);
      console.log('Firebase Admin: Connected successfully');
    } else {
      console.log('Firebase Admin: Missing credentials');
    }
  } catch (error) {
    console.log('Firebase Admin: ' + error.message);
  }

  // TEST 3: Vertex AI
  try {
    if (process.env.VERTEX_PROJECT_ID && process.env.VERTEX_LOCATION && process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      const vertexAI = new VertexAI({
        project: process.env.VERTEX_PROJECT_ID,
        location: process.env.VERTEX_LOCATION,
        googleAuthOptions: {
          credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          },
        },
      });

      const model = vertexAI.getGenerativeModel({ model: process.env.VERTEX_MODEL });
      const prompt = `Reply with only this exact JSON, nothing else:
{ "status": "ok" }`;

      const result = await model.generateContent(prompt);
      const rawText = result.response.candidates[0].content.parts[0].text;
      console.log('Vertex AI: Connected successfully');
      console.log('   Raw response: ' + rawText.trim());
    } else {
      console.log('Vertex AI: Missing GOOGLE/VERTEX credentials');
    }
  } catch (error) {
    console.log('Vertex AI: ' + error.message);
  }

  console.log('\nHealthSync Backend Environment Check Complete');
};

main();
