// Mood tracking functions
const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');

// Add a mood entry
exports.addMoodEntry = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new Error("Unauthenticated");

  const { mood, note, timestamp } = req.data;
  if (!mood || typeof mood !== "string") throw new Error("Mood is required.");

  const auth = new GoogleAuth();
  const client = await auth.getIdTokenClient(process.env.MODEL_API_URL);
  const headers = await client.getRequestHeaders();

  const { data: analysis } = await axios.post(
    process.env.MODEL_API_URL,
    { paragraph: note || "" },
    { headers }
  );

  const entry = {
    mood,
    note: note || "",
    timestamp: timestamp || new Date().toISOString(),
    moodAnalysis: analysis.mood ?? null,
    riskAnalysis: analysis.risk ?? null,
    emotionAnalysis: analysis.emotion ?? null
  };

  const ref = await admin
    .firestore()
    .collection("users")
    .doc(uid)
    .collection("moodEntries")
    .add(entry);

  return { success: true, id: ref.id };
});

// Get mood entries
exports.getMoodEntries = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new Error("Unauthenticated");

  const snapshot = await admin
    .firestore()
    .collection("users")
    .doc(uid)
    .collection("moodEntries")
    .orderBy("timestamp", "desc")
    .limit(100)
    .get();

  const moods = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  return { moods };
}); 