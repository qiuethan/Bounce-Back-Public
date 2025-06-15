// User progress tracking functions
const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Track user progress across different metrics
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