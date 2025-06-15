import React from 'react';
import { View, Text, TouchableOpacity, Modal, Alert, Linking, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';


const DistressModal = ({ visible, onClose }) => {

    const router = useRouter();

    const confirmEmergencyCall = () => {
    Alert.alert(
        "Call 911?",
        "This will place an emergency call to 911. Would you like to continue?",
        [
        { text: "Cancel", style: "cancel" },
        { text: "Call 911", style: "destructive", onPress: () => Linking.openURL('tel:911') }
        ]
    );
    };

    const confirmHelplineCall = () => {
    Alert.alert(
        "Call a Helpline?",
        "This will connect you to a 24/7 helpline. Continue?",
        [
        { text: "Cancel", style: "cancel" },
        { text: "Call", onPress: () => Linking.openURL('tel:988') }
        ]
    );
    };

    return (
    <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
        <View style={styles.container}>
            <Text style={styles.title}>We’re here for you 💚</Text>

            <TouchableOpacity style={styles.option}><Text>🧘 Try a Grounding Exercise</Text></TouchableOpacity>

            <TouchableOpacity style={styles.option}><Text>🌬️ Breathing Timer</Text></TouchableOpacity>

            <TouchableOpacity 
                style={styles.option}
                onPress={() => {
                    onClose(); 
                    router.push('../journal/journal');
                }}
                >
                <Text>📝 Quick Journal</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.option}
                onPress={() => {
                    onClose(); 
                    router.push('/chat');
                }}
                >
                <Text>🤖 Chat with BounceBot</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.option}
              onPress={() => {
                  onClose(); 
                  router.push('../contacts/contacts');
              }}
            >
              <Text>📞 Call/Text a Support Contact</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.option, styles.helpline]} onPress={confirmHelplineCall}>
            <Text style={styles.helplineText}>☎️ Talk to a Helpline</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.option, styles.critical]} onPress={confirmEmergencyCall}>
            <Text style={styles.criticalText}>📞 Call 911 (Emergency)</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.modalOption, styles.closeButton]}
                onPress={() => {
                    Alert.alert(
                    "You're not alone 💚",
                    "If you ever need support, this button is always here for you.",
                    [{ text: "Got it", style: "default", onPress: onClose }]
                    );
                }}
                >
                <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
        </View>
        </View>
    </Modal>
    );
};

export default DistressModal;

import COLORS from '../../constants/colors';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.modalOverlay
  },
  container: {
    backgroundColor: COLORS.white,
    padding: 24,
    width: '90%',
    borderRadius: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: COLORS.darkText,
  },
  option: {
    paddingVertical: 12,
  },
  critical: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  helpline: {
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  criticalText: {
    color: COLORS.textDark,
    fontWeight: '600',
  },
  helplineText: {
    color: COLORS.textDark,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
  },
});