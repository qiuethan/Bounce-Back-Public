import { Stack, Redirect, useSegments } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import AuthProvider, { useAuth } from "./contexts/auth_provider";
import OnboardingProvider, { useOnboarding } from "./contexts/onboarding_provider";
import { UserProfileProvider, useUserProfile } from "./contexts/profile_provider";
import COLORS from "./constants/colors";

const InnerLayout = () => {
  const { user, loading: authLoading } = useAuth();
  const { onboardingComplete, loadingOnboarding } = useOnboarding();
  const { profile, loading: profileLoading } = useUserProfile();
  const segments = useSegments();

  const inAuthFlow = segments[0] === "auth";
  const inOnboarding = segments[0] === "onboarding";

  const [userStabilized, setUserStabilized] = useState(false);
  const timerRef = useRef(null);

  // Introduce delay to allow Firestore functions to complete after signup
  useEffect(() => {
    if (user && !userStabilized) {
      timerRef.current = setTimeout(() => {
        setUserStabilized(true);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user]);

  // Show loading spinner while waiting for user or onboarding/profile
  if (authLoading || loadingOnboarding || profileLoading || (user && !userStabilized)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Redirect if not authenticated
  if (!user && !inAuthFlow) {
    return <Redirect href="/auth" />;
  }

  // Redirect to onboarding if not completed
  if (user && !onboardingComplete && !inOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  // If onboarding is complete but user is in /auth or /onboarding
  if (user && onboardingComplete && (inAuthFlow || inOnboarding)) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <UserProfileProvider>
          <InnerLayout />
        </UserProfileProvider>
      </OnboardingProvider>
    </AuthProvider>
  );
}
