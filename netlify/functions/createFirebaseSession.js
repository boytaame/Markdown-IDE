// netlify/functions/createFirebaseSession.js

const admin = require("firebase-admin");
const { OAuth2Client } = require("google-auth-library");

// Initialize Firebase Admin SDK only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost";

exports.handler = async (event) => {
  const { code } = JSON.parse(event.body);

  const oAuth2Client = new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URI,
  );

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    const idToken = tokens.id_token;
    const ticket = await oAuth2Client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const email = payload.email;
    const displayName = payload.name;
    const photoURL = payload.picture;

    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch (error) {
      userRecord = await admin.auth().createUser({ email, displayName, photoURL });
    }

    const firebaseToken = await admin.auth().createCustomToken(userRecord.uid);

    return {
      statusCode: 200,
      body: JSON.stringify({ token: firebaseToken }),
    };
  } catch (error) {
    console.error("Authentication failed:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Google Sign-In failed." }),
    };
  }
};