import React, { createContext, useContext, useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { FIREBASE_AUTH, FIREBASE_FUNCTIONS } from '../../FirebaseConfig';
import { useAuth } from './auth_provider';

const OnboardingContext = createContext(null);
export const useOnboarding = () => useContext(OnboardingContext);

const updateUserData = httpsCallable(FIREBASE_FUNCTIONS, 'updateUserData');
const getOnboardingStatus = httpsCallable(FIREBASE_FUNCTIONS, 'getOnboardingStatus');

export default function OnboardingProvider({ children }) {
  const { user } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [profile, setProfile] = useState({});
  const [loadingOnboarding, setLoadingOnboarding] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    if (!user) {
      setLoadingOnboarding(false);
      setOnboardingComplete(false);
      setProfile({});
      setError(null);
      return;
    }

    if (error) {
      setLoadingOnboarding(false);
      return;
    }

    try {
      setLoadingOnboarding(true);
      const result = await getOnboardingStatus();

      // Delay to allow Firestore profile creation to catch up after signup
      await new Promise(resolve => setTimeout(resolve, 1000));

      setOnboardingComplete(result.data.onboardingComplete || false);
      setProfile(result.data.profile || {});
      setError(null);
    } catch (error) {
      console.log("❌ Failed to fetch onboarding status:", error);
      setOnboardingComplete(false);
      setProfile({});
      setError(error);
    } finally {
      setLoadingOnboarding(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [user?.uid, error]);

  const updateProfile = async (updates) => {
    if (!user) return;
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
  };

  const finalizeOnboarding = async (lastPage) => {
    if (!user) return;
    const finalProfile = {
      ...profile,
      ...lastPage,
      onboardingComplete: true,
    };

    try {
      await updateUserData({ profile: finalProfile });
      await fetchStatus();
      setOnboardingComplete(true);
    } catch (error) {
      console.error('❌ Failed to finalize onboarding:', error);
      throw error;
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        onboardingComplete,
        loadingOnboarding,
        profile,
        error,
        updateProfile,
        finalizeOnboarding,
        refetchProfile: fetchStatus,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}
