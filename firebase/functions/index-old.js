// This is the original monolithic index.js file - kept as backup
// The functions have been reorganized into separate modules
// See the new index.js for the organized structure

// Original file content moved to backup - refer to git history for complete original file 

const functions = require('firebase-functions');
const { onCall } = require("firebase-functions/v2/https");
const { onMessagePublished } = require("firebase-functions/v2/pubsub");
const { auth, pubsub } = require("firebase-functions/v1");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const { onSchedule } = require("firebase-functions/v2/scheduler");

const { formatPrompt } = require("./prompts/bouncebot");
const { callMistral } = require("./llm/callMistral");

const serviceAccount = require("./serviceAccountKey.json");

const fetch = require("node-fetch");
require('dotenv').config();

const { GoogleAuth } = require('google-auth-library');

const axios = require('axios');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

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

exports.createUserData = auth.user().onCreate(async (user) => {
  const uid = user.uid;
  const name = user.displayName || "User";

  try {
    const userRef = admin.firestore().doc(`users/${uid}`);
    await userRef.set({
      profile: {
        name,
        createdAt: new Date(),
        onboardingComplete: false,
        avoidanceZonesEnabled: false,
        xp: 0
      }
    });

    // Create empty collections
    const collections = [
      'journals',
      'moodEntries',
      'outdoor_activities',
      'avoidanceZones',
      'moodProgress'
    ];

    // Create a dummy document in each collection to initialize it
    // This document will be deleted immediately after creation
    for (const collectionName of collections) {
      const dummyDocRef = userRef.collection(collectionName).doc('init');
      await dummyDocRef.set({ init: true });
      await dummyDocRef.delete();
    }

    // Add a welcome journal entry
    const journalRef = userRef.collection("journals").doc();
    await journalRef.set({
      text: "Welcome to Bounce Back! This is your first journal entry.",
      timestamp: new Date().toISOString()
    });

    console.log(`✅ Created profile + collections for UID: ${uid}`);
  } catch (error) {
    console.error(`❌ Failed to create user data for UID: ${uid}`, error);
    throw new Error(`Failed to create user data: ${error.message}`);
  }
});

exports.updateUserData = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { profile = {} } = req.data;

  if (!uid) throw new Error("Unauthenticated");

  const userRef = admin.firestore().doc(`users/${uid}`);
  const updates = {};

  // Merge profile fields
  if (Object.keys(profile).length > 0) {
    for (const key in profile) {
      updates[`profile.${key}`] = profile[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new Error("No valid fields to update.");
  }

  try {
    await userRef.update(updates);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to update user ${uid}:`, error);
    throw new Error("Failed to update user data.");
  }
});

exports.getOnboardingStatus = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new Error("Unauthenticated");

  const userRef = admin.firestore().doc(`users/${uid}`);
  const userSnap = await userRef.get();

  if (!userSnap.exists) throw new Error("User not found");

  const data = userSnap.data();
  const onboardingComplete = data?.profile?.onboardingComplete || false;

  return { onboardingComplete };
});

exports.getProfile = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new Error("Unauthenticated");

  try {
    const userRef = admin.firestore().doc(`users/${uid}`);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      // Create default profile for new users
      const defaultProfile = {
        name: "User",
        createdAt: new Date().toISOString(),
        onboardingComplete: false,
        avoidanceZonesEnabled: false,
        xp: 0
      };

      await userRef.set({ profile: defaultProfile });
      return { profile: defaultProfile };
    }

    const profile = userSnap.get("profile") || {};
    return { profile };
  } catch (error) {
    console.error(`❌ Failed to get/create profile for UID: ${uid}`, error);
    throw new Error("Failed to get profile data");
  }
});

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

exports.toggleAvoidanceZones = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { enabled } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (typeof enabled !== "boolean") throw new Error("Invalid value for enabled");

  const userRef = admin.firestore().doc(`users/${uid}`);
  await userRef.update({
    "profile.avoidanceZonesEnabled": enabled,
  });

  return { success: true };
});

exports.addAvoidanceZone = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { label, lat, lng, radius } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (!label || typeof label !== "string") throw new Error("Invalid label");
  if (!lat || !lng) throw new Error("Invalid coordinates");
  if (typeof lat !== "number" || typeof lng !== "number") {
    throw new Error("Coordinates must be numbers");
  }

  const avoidanceZoneRef = admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('avoidanceZones')
    .doc();

  const newEntry = {
    label,
    coordinates: {
      lat,
      lng,
    },
    radius: radius
  };

  await avoidanceZoneRef.set(newEntry);

  return { success: true, id: avoidanceZoneRef.id };
});

exports.deleteAvoidanceZone = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { zoneId } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (!zoneId) throw new Error("Missing zone ID");

  const zoneRef = admin.firestore()
    .collection('users')
    .doc(uid)
    .collection('avoidanceZones')
    .doc(zoneId);

  await zoneRef.delete();

  return { success: true };
});

exports.getAvoidanceZones = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;

  if (!uid) throw new Error("Unauthenticated");

  const zonesRef = admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('avoidanceZones');

  const snapshot = await zonesRef.get();

  const zones = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  return { zones };
});

exports.addContact = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { 
    name, 
    phone, 
    relationship, 
    closenessRating, 
    supportType, 
    lastContacted, 
    priorityTag, 
    contactFrequency,
  } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (!name || typeof name !== "string") throw new Error("Invalid name");
  if (!phone || typeof phone !== "string") throw new Error("Invalid phone number");

  const contactRef = admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('contacts')
    .doc();

  const newContact = {
    name,
    phone,
    relationship,
    closenessRating,
    supportType,
    lastContacted,
    priorityTag,
    contactFrequency,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await contactRef.set(newContact);

  return { success: true, id: contactRef.id };
});

exports.getContacts = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;

  if (!uid) {
    throw new Error("Unauthenticated");
  }

  try {
    const contactsRef = admin
      .firestore()
      .collection("users")
      .doc(uid)
      .collection("contacts");

    const snapshot = await contactsRef.get();

    const contacts = snapshot.docs.map((doc) => {
      const data = doc.data();
      const { closenessRating, ...publicData } = data; // Hide sensitive field
      return { id: doc.id, ...publicData };
    });

    return { success: true, contacts };
  } catch (error) {
    console.error("Failed to get contacts:", error);
    throw new Error("Failed to get contacts");
  }
});

exports.updateContact = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { contactId, updates } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (!contactId || typeof contactId !== "string") throw new Error("Invalid contact ID");

  const contactRef = admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('contacts')
    .doc(contactId);

  await contactRef.update(updates);

  return { success: true };
});

exports.deleteContact = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { contactId } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (!contactId) throw new Error("Missing contact ID");

  const contactRef = admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('contacts')
    .doc(contactId);

  await contactRef.delete();

  return { success: true };
});

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

exports.trackContactInteraction = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { contactId, interactionType, timestamp } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (!contactId) throw new Error("Missing contact ID");
  if (!interactionType || !["call", "text"].includes(interactionType)) {
    throw new Error("Invalid interaction type");
  }

  const contactRef = admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('contacts')
    .doc(contactId);

  const interactionRef = contactRef.collection('interactions').doc();

  const interaction = {
    type: interactionType,
    timestamp: timestamp || new Date().toISOString(),
  };

  await Promise.all([
    // Add the interaction
    interactionRef.set(interaction),
    // Update the contact's lastContacted field
    contactRef.update({
      lastContacted: interaction.timestamp,
    })
  ]);

  return { success: true, id: interactionRef.id };
});

exports.getContactInteractions = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { contactId } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (!contactId) throw new Error("Missing contact ID");

  const interactionsRef = admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('contacts')
    .doc(contactId)
    .collection('interactions');

  const snapshot = await interactionsRef
    .orderBy('timestamp', 'desc')
    .limit(50)
    .get();

  const interactions = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return { interactions };
});

exports.startWorkout = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { type = 'workout' } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (!['workout', 'outdoor_activity'].includes(type)) {
    throw new Error("Invalid activity type");
  }

  try {
    const workoutRef = await admin.firestore()
      .collection('users')
      .doc(uid)
      .collection('activities')
      .add({
        type,
        startTime: new Date().toISOString(),
        status: 'active',
        duration: 0,
        xpGained: 0,
        ...(type === 'outdoor_activity' ? {
          locations: [],
          distance: 0,
        } : {}),
      });

    return {
      success: true,
      workoutId: workoutRef.id,
    };
  } catch (error) {
    console.error(`❌ Failed to start ${type} for UID: ${uid}`, error);
    throw new Error(`Failed to start ${type} tracking.`);
  }
});

exports.endWorkout = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { workoutId, duration, type = 'workout', distance, xpGained, locations, finalPath } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (!workoutId || duration === undefined) throw new Error("Workout ID and duration are required");
  if (!['workout', 'outdoor_activity'].includes(type)) {
    throw new Error("Invalid activity type");
  }

  try {
    const workoutRef = admin.firestore()
      .collection('users')
      .doc(uid)
      .collection('activities')
      .doc(workoutId);
    
    const workout = await workoutRef.get();

    if (!workout.exists) throw new Error("Workout not found");
    if (workout.data().type !== type) throw new Error("Invalid activity type");

    // Calculate XP if not provided (for indoor workouts)
    const finalXP = xpGained || Math.floor(duration / 60);

    // Update workout with final data
    await workoutRef.update({
      endTime: new Date().toISOString(),
      duration: duration,
      status: 'completed',
      xpGained: finalXP,
      ...(type === 'outdoor_activity' ? {
        distance: distance || 0,
        locations: locations || [],
        finalPath: finalPath || [],
      } : {}),
    });

    // Update user's XP in their profile
    const userRef = admin.firestore().doc(`users/${uid}`);
    await userRef.update({
      'profile.xp': admin.firestore.FieldValue.increment(finalXP),
    });

    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to end ${type} for UID: ${uid}`, error);
    throw new Error(`Failed to end ${type}.`);
  }
});

exports.getActivities = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new Error("Unauthenticated");

  try {
    const activitiesRef = admin
      .firestore()
      .collection('users')
      .doc(uid)
      .collection('activities')
      .orderBy('startTime', 'desc');

    const snapshot = await activitiesRef.get();
    const activities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      success: true,
      activities
    };
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    throw new Error('Failed to fetch activities');
  }
});

exports.addChore = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { name, description, frequency, importance, icon } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (!name || typeof name !== "string") throw new Error("Invalid name");
  if (!frequency || !['day', 'week', 'month', 'year'].includes(frequency)) {
    throw new Error("Invalid frequency");
  }
  if (!importance || !['low', 'medium', 'high'].includes(importance)) {
    throw new Error("Invalid importance");
  }

  const choreRef = admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('chores')
    .doc();

  const newChore = {
    name,
    description: description || '',
    frequency,
    importance,
    icon: icon || 'list-outline',
    isCompleted: false,
    createdAt: new Date().toISOString(),
    completionCount: 0,
  };

  await choreRef.set(newChore);

  return { success: true, id: choreRef.id };
});

exports.getChores = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new Error("Unauthenticated");

  const choresRef = admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('chores');

  const snapshot = await choresRef.get();
  const chores = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return { chores };
});

exports.deleteChore = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { choreId } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (!choreId) throw new Error("Missing chore ID");

  const choreRef = admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('chores')
    .doc(choreId);

  await choreRef.delete();
  return { success: true };
});

exports.completeChore = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { choreId } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (!choreId) throw new Error("Missing chore ID");

  const choreRef = admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('chores')
    .doc(choreId);

  const chore = await choreRef.get();
  if (!chore.exists) throw new Error("Chore not found");

  const currentCount = chore.data().completionCount || 0;
  await choreRef.update({
    isCompleted: true,
    lastCompleted: new Date().toISOString(),
    completionCount: currentCount + 1
  });

  return { success: true };
});

exports.uncompleteChore = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { choreId } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (!choreId) throw new Error("Missing chore ID");

  const choreRef = admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('chores')
    .doc(choreId);

  const chore = await choreRef.get();
  if (!chore.exists) throw new Error("Chore not found");

  const currentCount = chore.data().completionCount || 0;
  await choreRef.update({
    isCompleted: false,
    lastCompleted: null,
    completionCount: Math.max(0, currentCount - 1)
  });

  return { success: true };
});

exports.trackUserProgress = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new Error("Unauthenticated");

  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    const userRef = admin.firestore().doc(`users/${uid}`);
    
    // Fetch collections with 14-day limit
    const [journalsSnap, moodEntriesSnap, activitiesSnap, choresSnap, contactsSnap] = await Promise.all([
      userRef.collection('journals')
        .where('timestamp', '>=', fourteenDaysAgo.toISOString())
        .orderBy('timestamp', 'desc')
        .get(),
      userRef.collection('moodEntries')
        .where('timestamp', '>=', fourteenDaysAgo.toISOString())
        .orderBy('timestamp', 'desc')
        .get(),
      userRef.collection('activities')
        .where('startTime', '>=', fourteenDaysAgo.toISOString())
        .orderBy('startTime', 'desc')
        .get(),
      userRef.collection('chores').get(),
      userRef.collection('contacts').get()
    ]);

    // Process each collection
    const data = {
      chores: choresSnap.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })),
      contacts: contactsSnap.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })),
      moodEntries: moodEntriesSnap.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })),
      activities: activitiesSnap.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })),
      journals: journalsSnap.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }))
    };

    // Process contacts to get top 5 by recent contact or priority
    const processedContacts = data.contacts.map(contact => {
      const recentInteractions = contact.lastContacted && new Date(contact.lastContacted) >= sevenDaysAgo ? 1 : 0;
      return {
        name: contact.name,
        priority: contact.priorityTag || 'low',
        recentInteractions,
        lastContacted: contact.lastContacted,
        supportType: contact.supportType
      };
    });

    // Sort contacts first by recent interactions, then by priority if no recent interactions
    const sortedContacts = processedContacts.sort((a, b) => {
      if (a.recentInteractions !== b.recentInteractions) {
        return b.recentInteractions - a.recentInteractions;
      }
      const priorityOrder = { High: 3, Medium: 2, Low: 1 };
      return priorityOrder[b.priorityTag] - priorityOrder[a.priorityTag];
    });

    // Process emotions and risks from journals and mood entries
    const processEmotions = (entries) => {
      const emotions = {};
      let totalRiskScore = 0;
      let riskCounts = { low: 0, medium: 0, high: 0 };
      let signedStrengthTotal = 0;
      
      entries.forEach(entry => {
        // Process emotions from journal entries
        if (entry.emotion && entry.emotion.per_sentence) {
          entry.emotion.per_sentence.forEach(sentence => {
            if (sentence.emotion_scores) {
              Object.entries(sentence.emotion_scores).forEach(([emotion, score]) => {
                const strength = Number(score);
                if (strength > 0.5) {  // Only track significant emotions
                  emotions[emotion] = Math.max(emotions[emotion] || 0, strength);
                }
              });
            }
          });
        }
        
        // Process emotions from mood entries
        if (entry.emotionAnalysis && entry.emotionAnalysis.per_sentence) {
          entry.emotionAnalysis.per_sentence.forEach(sentence => {
            if (sentence.emotion_scores) {
              Object.entries(sentence.emotion_scores).forEach(([emotion, score]) => {
                const strength = Number(score);
                if (strength > 0.5) {  // Only track significant emotions
                  emotions[emotion] = Math.max(emotions[emotion] || 0, strength);
                }
              });
            }
          });
        }

        // Process mood analysis
        if (entry.mood && typeof entry.mood === 'object') {
          if (entry.mood.signed_strength) {
            signedStrengthTotal += Number(entry.mood.signed_strength);
          }
        }
        
        // Process risk levels
        const processRisk = (riskData) => {
          if (!riskData) return;
          
          if (typeof riskData === 'object' && riskData.mean_risk) {
            const riskScore = Number(riskData.mean_risk);
            // Categorize risk score into levels
            let riskLevel;
            if (riskScore < 0.3) riskLevel = 'low';
            else if (riskScore < 0.6) riskLevel = 'medium';
            else riskLevel = 'high';
            
            totalRiskScore += riskScore;
            riskCounts[riskLevel]++;
          }
        };

        processRisk(entry.risk);
        processRisk(entry.riskAnalysis);
      });

      const totalEntries = entries.length;
      const avgSignedStrength = totalEntries > 0 ? 
        Number((signedStrengthTotal / totalEntries).toFixed(2)) : 0;
      
      const totalRiskEntries = Object.values(riskCounts).reduce((sum, count) => sum + count, 0);
      const avgRiskScore = totalRiskEntries > 0 ? 
        Number((totalRiskScore / totalRiskEntries).toFixed(2)) : 0;

      // Sort emotions by strength and convert to array
      const significantEmotions = Object.entries(emotions)
        .sort(([,a], [,b]) => b - a)
        .map(([emotion]) => emotion);

      return {
        significantEmotions,  // array of strings, ordered by strength
        riskLevels: riskCounts,  // Object with number values
        averageRisk: avgRiskScore,  // number
        moodStrength: avgSignedStrength  // number
      };
    };

    // Convert emoji to numerical scale
    const emojiToScale = (emoji) => {
      const scale = {
        "😭": 1,
        "😔": 2,
        "😐": 3,
        "🙂": 4,
        "😄": 5
      };
      return Number(scale[emoji] || 3);
    };

    // Calculate AI-friendly summary
    const userData = {
      journals: {
        mostRecent: data.journals[0] ? {
          timestamp: new Date(data.journals[0].timestamp).toISOString(),  // ISO string
          text: String(data.journals[0].text || '').substring(0, 200) + 
            (String(data.journals[0].text || '').length > 200 ? '...' : ''),  // string
          mood: {
            strength: Number(data.journals[0].mood?.signed_strength || 0),  // number
            meanPolarity: Number(data.journals[0].mood?.mean_polarity || 0)  // number
          },
          risk: {
            mean: Number(data.journals[0].risk?.mean_risk || 0),  // number
            max: Number(data.journals[0].risk?.max_risk || 0)  // number
          }
        } : null,  // null instead of string for no entries
        analytics: {
          entriesPerWeek: Number((data.journals.length / 2).toFixed(1)),  // number
          ...processEmotions(data.journals)
        }
      },
      moodEntries: {
        mostRecent: data.moodEntries[0] ? {
          timestamp: new Date(data.moodEntries[0].timestamp).toISOString(),  // ISO string
          moodScale: emojiToScale(data.moodEntries[0].mood),  // number (1-5)
          note: String(data.moodEntries[0].note || ''),  // string
          analysis: {
            meanPolarity: Number(data.moodEntries[0].moodAnalysis?.mean_polarity || 0),  // number
            signedStrength: Number(data.moodEntries[0].moodAnalysis?.signed_strength || 0),  // number
            risk: Number(data.moodEntries[0].riskAnalysis?.mean_risk || 0)  // number
          }
        } : null,  // null instead of string for no entries
        analytics: {
          entriesPerWeek: Number((data.moodEntries.length / 2).toFixed(1)),  // number
          averageMood: Number((data.moodEntries.reduce((sum, entry) => sum + emojiToScale(entry.mood), 0) / 
            (data.moodEntries.length || 1)).toFixed(2)),  // number
          ...processEmotions(data.moodEntries)
        }
      },
      activities: {
        mostRecent: data.activities[0] ? {
          timestamp: new Date(data.activities[0].startTime).toISOString(),  // ISO string
          type: String(data.activities[0].type),  // string
          duration: Number(data.activities[0].duration)  // number (minutes)
        } : null,  // null instead of string for no entries
        averages: {
          activitiesPerWeek: Number((data.activities.length / 2).toFixed(1)),  // number
          avgDurationMinutes: Number(Math.round(
            data.activities.reduce((sum, act) => sum + (Number(act.duration) || 0), 0) / 
            (data.activities.length || 1)
          )),  // number
          typeDistribution: {  // object with number values
            workout: Number(data.activities.filter(a => a.type === 'workout').length),
            outdoor: Number(data.activities.filter(a => a.type === 'outdoor_activity').length)
          }
        }
      },
      chores: {
        activeChores: Number(data.chores.filter(c => !c.lastCompleted || 
          new Date(c.lastCompleted) >= sevenDaysAgo).length),  // number
        completedLastWeek: Number(data.chores.filter(c => 
          c.lastCompleted && 
          new Date(c.lastCompleted) >= sevenDaysAgo
        ).length),  // number
        byImportance: {  // object with number values
          high: Number(data.chores.filter(c => c.importance === 'high').length),
          medium: Number(data.chores.filter(c => c.importance === 'medium').length),
          low: Number(data.chores.filter(c => c.importance === 'low').length)
        }
      },
      contacts: {
        topContacts: data.contacts
          .sort((a, b) => {
            const aRecent = a.lastContacted && new Date(a.lastContacted) >= sevenDaysAgo;
            const bRecent = b.lastContacted && new Date(b.lastContacted) >= sevenDaysAgo;
            if (aRecent !== bRecent) return bRecent ? 1 : -1;
            
            const priorityOrder = { High: 3, Medium: 2, Low: 1 };
            return priorityOrder[b.priorityTag] - priorityOrder[a.priorityTag];
          })
          .slice(0, 5)
          .map(contact => ({
            name: String(contact.name),  // string
            relationship: String(contact.relationship || ''),  // string
            supportTypes: Array.isArray(contact.supportType) ? 
              contact.supportType.map(t => String(t)) : [],  // array of strings
            lastContacted: contact.lastContacted ? 
              new Date(contact.lastContacted).toISOString() : null,  // ISO string or null
            priority: String(contact.priorityTag || 'Low')  // string
          })),
        totalActive: Number(data.contacts.filter(c => 
          c.lastContacted && new Date(c.lastContacted) >= sevenDaysAgo
        ).length),  // number
        totalContacts: Number(data.contacts.length)  // number
      },
      timeRange: {
        start: fourteenDaysAgo.toISOString(),  // ISO string
        end: now.toISOString()  // ISO string
      }
    };

    // Store snapshot
    const today = new Date().toISOString().split('T')[0];
    const progressRef = userRef.collection('progressSnapshots').doc(today);
    
    await progressRef.set({
      timestamp: now.toISOString(),
      userData,
      metadata: {
        version: '1.3',
        calculatedAt: now.toISOString(),
        updatedAt: now.toISOString(),
        timeRange: '14days'
      }
    }, { merge: true });

    return { userData };
  } catch (error) {
    console.error(`Failed to track progress for user ${uid}:`, error);
    throw new Error('Failed to track user progress');
  }
});

// Add Pub/Sub trigger for daily chore reset
exports.scheduledChoreReset = onSchedule("0 0 * * *", async (event) => {
  try {
    const usersSnapshot = await admin.firestore().collection('users').get();
    
    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      const choresRef = admin
        .firestore()
        .collection('users')
        .doc(uid)
        .collection('chores');
      
      const choresSnapshot = await choresRef.get();
      const now = new Date();
      
      for (const choreDoc of choresSnapshot.docs) {
        const chore = choreDoc.data();
        if (!chore.isCompleted || !chore.lastCompleted) continue;
        
        const lastCompleted = new Date(chore.lastCompleted);
        let shouldReset = false;
        
        switch (chore.frequency) {
          case 'day':
            // Reset if it's a new day (past midnight)
            shouldReset = now.getDate() !== lastCompleted.getDate() ||
                         now.getMonth() !== lastCompleted.getMonth() ||
                         now.getFullYear() !== lastCompleted.getFullYear();
            break;
          case 'week':
            // Reset if more than 7 days have passed
            shouldReset = (now.getTime() - lastCompleted.getTime()) > 7 * 24 * 60 * 60 * 1000;
            break;
          case 'month':
            // Reset if we're in a different month
            shouldReset = now.getMonth() !== lastCompleted.getMonth() ||
                         now.getFullYear() !== lastCompleted.getFullYear();
            break;
          case 'year':
            // Reset if we're in a different year
            shouldReset = now.getFullYear() !== lastCompleted.getFullYear();
            break;
        }
        
        if (shouldReset) {
          await choreDoc.ref.update({
            isCompleted: false,
            lastCompleted: null
          });
          
          console.log(`Reset chore ${choreDoc.id} for user ${uid}`);
        }
      }
    }
    
    console.log('Completed daily chore reset check');
    return null;
  } catch (error) {
    console.error('Failed to reset chores:', error);
    return null;
  }
});

exports.getDataTypes = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new Error("Unauthenticated");

  // Define data types on the server side
  const dataTypes = [
    { id: 'activities', label: 'Activity History', icon: 'fitness-outline' },
    { id: 'avoidanceZones', label: 'Avoidance Zones', icon: 'ban-outline' },
    { id: 'chores', label: 'Chore History', icon: 'checkbox-outline' },
    { id: 'journals', label: 'Journal Entries', icon: 'book-outline' },
    { id: 'moodEntries', label: 'Mood Entries', icon: 'happy-outline' },
    { id: 'contacts', label: 'Support Contacts', icon: 'people-outline' },
    { id: 'progressSnapshots', label: 'Progress Snapshots', icon: 'stats-chart-outline' }
  ].sort((a, b) => a.label.localeCompare(b.label));

  return { dataTypes };
});

exports.deleteUserData = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { collections } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (!collections || !Array.isArray(collections)) {
    throw new Error("Invalid collections parameter");
  }

  // Define allowed collections on the server side
  const allowedCollections = [
    'activities',
    'moodEntries',
    'journals',
    'chores',
    'avoidanceZones',
    'contacts',
    'progressSnapshots'
  ];

  // Validate collections
  const invalidCollections = collections.filter(col => !allowedCollections.includes(col));
  if (invalidCollections.length > 0) {
    throw new Error(`Invalid collections: ${invalidCollections.join(', ')}`);
  }

  try {
    const userRef = admin.firestore().collection('users').doc(uid);
    const batch = admin.firestore().batch();

    for (const collection of collections) {
      const collectionRef = userRef.collection(collection);
      const docs = await collectionRef.get();
      
      docs.forEach(doc => {
        batch.delete(doc.ref);
      });
    }

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to delete user data for UID: ${uid}`, error);
    throw new Error("Failed to delete user data");
  }
});

exports.resetChores = onMessagePublished("daily-chore-reset", async (event) => {
  try {
    const usersSnapshot = await admin.firestore().collection('users').get();
    
    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      const choresRef = admin
        .firestore()
        .collection('users')
        .doc(uid)
        .collection('chores');
      
      const choresSnapshot = await choresRef.get();
      const now = new Date();
      
      for (const choreDoc of choresSnapshot.docs) {
        const chore = choreDoc.data();
        if (!chore.isCompleted || !chore.lastCompleted) continue;
        
        const lastCompleted = new Date(chore.lastCompleted);
        let shouldReset = false;
        
        switch (chore.frequency) {
          case 'day':
            // Reset if more than 24 hours have passed
            shouldReset = (now.getTime() - lastCompleted.getTime()) > 24 * 60 * 60 * 1000;
            break;
          case 'week':
            // Reset if more than 7 days have passed
            shouldReset = (now.getTime() - lastCompleted.getTime()) > 7 * 24 * 60 * 60 * 1000;
            break;
          case 'month':
            // Reset if we're in a different month or more than 30 days have passed
            shouldReset = (
              now.getMonth() !== lastCompleted.getMonth() ||
              (now.getTime() - lastCompleted.getTime()) > 30 * 24 * 60 * 60 * 1000
            );
            break;
          case 'year':
            // Reset if we're in a different year
            shouldReset = now.getFullYear() !== lastCompleted.getFullYear();
            break;
        }
        
        if (shouldReset) {
          await choreDoc.ref.update({
            isCompleted: false,
            lastCompleted: null
          });
          
          logger.info(`Reset chore ${choreDoc.id} for user ${uid}`);
        }
      }
    }
    
    logger.info('Completed chore reset check');
    return null;
  } catch (error) {
    logger.error('Failed to reset chores:', error);
    return null;
  }
});