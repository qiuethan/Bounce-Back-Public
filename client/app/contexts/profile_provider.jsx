import React, { createContext, useContext, useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { FIREBASE_FUNCTIONS } from "../../FirebaseConfig";
import { useAuth } from "./auth_provider";

const UserProfileContext = createContext(null);
export const useUserProfile = () => useContext(UserProfileContext);

const getProfile = httpsCallable(FIREBASE_FUNCTIONS, "getProfile");

export const UserProfileProvider = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        setError(null);
        return;
      }

      if (error) {
        setLoading(false);
        return;
      }

      try {
        const result = await getProfile();

        // ✅ Add 1000ms delay to allow Firestore to stabilize after signup
        await new Promise(resolve => setTimeout(resolve, 1000));

        setProfile(result.data.profile);
        setError(null);
      } catch (error) {
        console.log("❌ Failed to fetch profile:", error);
        setError(error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, error]);

  return (
    <UserProfileContext.Provider value={{ profile, loading, error }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export default UserProfileProvider;
