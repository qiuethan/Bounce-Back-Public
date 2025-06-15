// Chat/AI bot related functions
const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { formatPrompt } = require("../prompts/bouncebot");
const { callMistral } = require("../llm/callMistral");

// Chat with BounceBot
exports.chatWithBounceBot = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const chatHistory = req.data.message;

  if (!uid) throw new Error("Unauthenticated");

  const userRef = admin.firestore().doc(`users/${uid}`);
  const userSnap = await userRef.get();

  if (!userSnap.exists) throw new Error("User data not found");

  // Get profile data
  const { profile = {} } = userSnap.data();

  // Get latest mood entry
  const moodEntriesRef = userRef.collection('moodEntries');
  const latestMoodSnap = await moodEntriesRef.orderBy('timestamp', 'desc').limit(1).get();
  const latestMood = latestMoodSnap.empty ? "neutral" : latestMoodSnap.docs[0].data().mood;

  // Get latest journal entry
  const journalsRef = userRef.collection('journals');
  const latestJournalSnap = await journalsRef.orderBy('timestamp', 'desc').limit(1).get();
  const lastJournal = latestJournalSnap.empty ? null : latestJournalSnap.docs[0].data().timestamp;

  // Get outdoor activities count for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const outdoorActivitiesRef = userRef.collection('outdoor_activities');
  const todayActivitiesSnap = await outdoorActivitiesRef
    .where('startTime', '>=', today.toISOString())
    .get();
  const daysOutside = todayActivitiesSnap.size;

  // Check if user is near any avoidance zones (assuming this is handled by the client)
  const nearTrigger = false;

  // Construct state object from collected data
  const state = {
    mood: latestMood,
    last_journal: lastJournal,
    days_outside: daysOutside,
    near_trigger: nearTrigger,
    checklist: [] // This could be moved to a separate collection if needed
  };

  const { system, user } = formatPrompt({ state, chatHistory });

  const reply = await callMistral({
    chatHistory: chatHistory
  });

  return { reply };
}); 