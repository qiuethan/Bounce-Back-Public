// Main Firebase Functions index - imports all organized modules
const functions = require('firebase-functions');
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Import all module functions
const authFunctions = require('./auth');
const userFunctions = require('./user');
const chatFunctions = require('./chat');
const journalFunctions = require('./journal');
const avoidanceZonesFunctions = require('./avoidance-zones');
const contactsFunctions = require('./contacts');
const moodFunctions = require('./mood');
const activitiesFunctions = require('./activities');
const choresFunctions = require('./chores');
const progressFunctions = require('./progress');
const dataManagementFunctions = require('./data-management');
const scheduledFunctions = require('./scheduled');

// Export all functions
// Authentication functions
exports.createUserData = authFunctions.createUserData;

// User management functions
exports.updateUserData = userFunctions.updateUserData;
exports.getOnboardingStatus = userFunctions.getOnboardingStatus;
exports.getProfile = userFunctions.getProfile;

// Chat functions
exports.chatWithBounceBot = chatFunctions.chatWithBounceBot;

// Journal functions
exports.addJournalEntry = journalFunctions.addJournalEntry;
exports.getJournalEntries = journalFunctions.getJournalEntries;
exports.deleteJournalEntry = journalFunctions.deleteJournalEntry;

// Avoidance zones functions
exports.toggleAvoidanceZones = avoidanceZonesFunctions.toggleAvoidanceZones;
exports.addAvoidanceZone = avoidanceZonesFunctions.addAvoidanceZone;
exports.deleteAvoidanceZone = avoidanceZonesFunctions.deleteAvoidanceZone;
exports.getAvoidanceZones = avoidanceZonesFunctions.getAvoidanceZones;

// Contact management functions
exports.addContact = contactsFunctions.addContact;
exports.getContacts = contactsFunctions.getContacts;
exports.updateContact = contactsFunctions.updateContact;
exports.deleteContact = contactsFunctions.deleteContact;
exports.trackContactInteraction = contactsFunctions.trackContactInteraction;
exports.getContactInteractions = contactsFunctions.getContactInteractions;

// Mood tracking functions
exports.addMoodEntry = moodFunctions.addMoodEntry;
exports.getMoodEntries = moodFunctions.getMoodEntries;

// Activity tracking functions
exports.startWorkout = activitiesFunctions.startWorkout;
exports.endWorkout = activitiesFunctions.endWorkout;
exports.getActivities = activitiesFunctions.getActivities;

// Chore management functions
exports.addChore = choresFunctions.addChore;
exports.getChores = choresFunctions.getChores;
exports.getChoreProgress = choresFunctions.getChoreProgress;
exports.deleteChore = choresFunctions.deleteChore;
exports.completeChore = choresFunctions.completeChore;
exports.uncompleteChore = choresFunctions.uncompleteChore;

// Progress tracking functions
exports.trackUserProgress = progressFunctions.trackUserProgress;
exports.getUserSnapshot = progressFunctions.trackUserProgress; // Alias for backwards compatibility

// Data management functions
exports.getDataTypes = dataManagementFunctions.getDataTypes;
exports.deleteUserData = dataManagementFunctions.deleteUserData;

// Scheduled functions
exports.scheduledChoreReset = scheduledFunctions.scheduledChoreReset;
exports.resetChores = scheduledFunctions.resetChores; 