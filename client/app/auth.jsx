import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable, Keyboard } from 'react-native';
import { FIREBASE_AUTH } from '../FirebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

import COLORS from './constants/colors';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [isRegister, setIsRegister] = useState(false);

  const handleLogin = async () => {
    setError(null);
    try {
      await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
    } catch (error) {
      switch (error.code) {
        case "auth/invalid-email":
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setError("Incorrect email or password.");
          break;
        case "auth/too-many-requests":
          setError("Too many failed attempts. Try again later.");
          break;
        case "auth/user-disabled":
          setError("Your account has been disabled.");
          break;
        default:
          setError("Login failed. Please try again.");
      }
    }
  };

  const handleRegister = async () => {
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    try {
      await createUserWithEmailAndPassword(FIREBASE_AUTH, email, password);
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.replace("/onboarding"); // or /home, /tabs, etc.
    } catch (error) {
      switch (error.code) {
        case "auth/invalid-email":
          setError("The email address is badly formatted.");
          break;
        case "auth/email-already-in-use":
          setError("An account with this email already exists.");
          break;
        case "auth/weak-password":
          setError("Password should be at least 6 characters.");
          break;
        default:
          setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <Pressable style={styles.inner} onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>{isRegister ? "Register" : "Login"}</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          autoCapitalize="none"
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {isRegister && (
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.fullButton} onPress={isRegister ? handleRegister : handleLogin}>
          <Text style={styles.buttonText}>
            {isRegister ? "Register" : "Login"}
          </Text>
        </Pressable>

        <Pressable style={styles.linkContainer} onPress={() => setIsRegister(!isRegister)}>
          <Text style={styles.linkText}>
            {isRegister ? "Already have an account? " : "Don't have an account? "}
          </Text>
          <Text style={[styles.linkText, styles.linkBold]}>
            {isRegister ? "Login" : "Register"}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

export default AuthPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: COLORS.white,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: COLORS.textDark,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    padding: 12,
    marginBottom: 16,
    color: COLORS.darkText,
    borderRadius: 10,
  },
  error: {
    color: COLORS.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  fullButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  linkContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 15,
  },
  linkBold: {
    fontWeight: 'bold',
  },
  inner: {
    flex: 1
  },
});