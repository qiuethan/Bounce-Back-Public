import { getFunctions, httpsCallable } from "firebase/functions";
import { FIREBASE_APP } from "../FirebaseConfig";

const functions = getFunctions(FIREBASE_APP);

// Export callable wrapped as a function
export const chatWithBounceBot = async (message) => {
    try {
      const call = httpsCallable(functions, "chatWithBounceBot");
      const result = await call({ message });
      return result.data.reply;
    } catch (error) {
      console.error("Bot error:", error.code, error.message);
      throw error;
    }
  };