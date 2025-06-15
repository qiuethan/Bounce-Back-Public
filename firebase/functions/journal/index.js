// Journal management functions
const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');

// Add a new journal entry
exports.addJournalEntry = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { entry, timestamp } = req.data;
  if (!uid) throw new Error("Unauthenticated");

  const auth = new GoogleAuth();
  const client = await auth.getIdTokenClient(process.env.MODEL_API_URL);
  const headers = await client.getRequestHeaders();

  const { data: analysis } = await axios.post(
    process.env.MODEL_API_URL,
    { paragraph: entry },
    { headers }
  );

  const journalRef = admin.firestore()
    .collection('users')
    .doc(uid)
    .collection('journals')
    .doc();

  const newEntry = {
    text: entry,
    timestamp: timestamp || new Date().toISOString(),
    mood: analysis.mood ?? null,
    risk: analysis.risk ?? null,
    emotion: analysis.emotion ?? null
  };

  await journalRef.set(newEntry);

  return { success: true, id: journalRef.id, entry: newEntry };
});

// Get all journal entries for a user
exports.getJournalEntries = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;

  if (!uid) throw new Error("Unauthenticated");

  const journalRef = admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('journals');

  const snapshot = await journalRef.orderBy('timestamp', 'desc').get();

  const entries = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  return { entries };
});

// Delete a journal entry
exports.deleteJournalEntry = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { entryId } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (!entryId) throw new Error("Missing entry ID");

  const entryRef = admin.firestore()
    .collection('users')
    .doc(uid)
    .collection('journals')
    .doc(entryId);

  await entryRef.delete();

  return { success: true };
}); 