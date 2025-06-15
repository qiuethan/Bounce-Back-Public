import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/auth_provider";
import COLORS from "../constants/colors";
import MoodEntryModal from "../components/mood-tracker/MoodEntryModal";

const TabsLayout = () => {
  const { user, loading } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Use ref to track animation state and prevent loops
  const isAnimatingRef = useRef(false);

  const animateHide = useCallback(() => {
    if (isAnimatingRef.current) return;
    
    isAnimatingRef.current = true;
    
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      isAnimatingRef.current = false;
    });
  }, [scaleAnim, fadeAnim]);

  const animateShow = useCallback(() => {
    if (isAnimatingRef.current) return;
    
    isAnimatingRef.current = true;
    
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      isAnimatingRef.current = false;
    });
  }, [scaleAnim, fadeAnim]);

  useEffect(() => {
    if (minimized) {
      animateHide();
    } else {
      animateShow();
    }
  }, [minimized, animateHide, animateShow]);

  if (loading) return null;
  if (!user) return <Redirect href="/auth" />;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size, focused }) => {
            let iconName;
            switch (route.name) {
              case "index":
                iconName = focused ? "home" : "home-outline";
                break;
              case "chat":
                iconName = focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline";
                break;
              case "progress":
                iconName = focused ? "bar-chart" : "bar-chart-outline";
                break;
              case "settings":
                iconName = focused ? "settings" : "settings-outline";
                break;
              default:
                iconName = "ellipse";
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarStyle: {
            height: 80,
            paddingBottom: 12,
            paddingTop: 8,
          },
        })}
      >
        <Tabs.Screen name="index" options={{ headerShown: false, tabBarLabel: "Home" }} />
        <Tabs.Screen name="chat" options={{ headerShown: false, tabBarLabel: "Chat" }} />
        <Tabs.Screen name="progress" options={{ headerShown: false, tabBarLabel: "Progress" }} />
        <Tabs.Screen name="settings" options={{ headerShown: false, tabBarLabel: "Settings" }} />
      </Tabs>

      <MoodEntryModal visible={modalVisible} onClose={() => setModalVisible(false)} />

      {/* Always render FAB, just animate opacity/scale */}
      <Animated.View
        style={[
          styles.fabWrapper,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
        pointerEvents={minimized ? "none" : "auto"}
      >
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Ionicons name="happy-outline" size={24} color={COLORS.white} />
          <TouchableOpacity style={styles.minimizeButton} onPress={() => setMinimized(true)}>
            <Ionicons name="remove-outline" size={14} color={COLORS.white} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>

      {minimized && (
        <TouchableOpacity style={styles.pullTab} onPress={() => setMinimized(false)}>
          <Ionicons name="chevron-back-outline" size={20} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default TabsLayout;

const styles = StyleSheet.create({
  fabWrapper: {
    position: "absolute",
    bottom: 100,
    right: 20,
    zIndex: 999,
  },
  fab: {
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  minimizeButton: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 16,
    padding: 4,
    zIndex: 1000,
  },
  pullTab: {
    position: "absolute",
    top: Dimensions.get("window").height / 2 - 30,
    right: 0,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    zIndex: 999,
    justifyContent: "center",
    alignItems: "center",
  },
});