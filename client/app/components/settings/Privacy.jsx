import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import COLORS from '../../constants/colors';
import DeleteDataModal from './DeleteDataModal';

export default function Privacy() {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.importantSection}>
            <View style={styles.iconContainer}>
              <Ionicons name="shield-checkmark" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.importantTitle}>Your Data is Private</Text>
            <Text style={styles.importantText}>
              We will never share or sell your personal data to third parties. Your privacy is our top priority.
            </Text>
          </View>
        </View>

        <View style={[styles.card, styles.secondCard]}>
          <Text style={styles.title}>Data Protection</Text>
          <Text style={styles.description}>
            • All your data is stored securely and encrypted
          </Text>
          <Text style={styles.description}>
            • We do not collect any data beyond what's necessary for the app to function
          </Text>
          <Text style={styles.description}>
            • You have full control over your data and can request deletion at any time
          </Text>
        </View>

        <View style={[styles.card, styles.secondCard]}>
          <Text style={styles.title}>Data Retention Policy</Text>
          <Text style={styles.description}>
            To protect your privacy, all personal data stored in Bounce Back is automatically deleted after one year of inactivity.
          </Text>
          <Text style={styles.description}>
            This includes your activity history, mood entries, journal entries, and other personal information.
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => setShowDeleteModal(true)}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
          <Text style={styles.deleteButtonText}>Delete My Data</Text>
        </TouchableOpacity>
      </ScrollView>

      <DeleteDataModal 
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
    flex: 1,
    textAlign: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondCard: {
    marginTop: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: COLORS.textDark,
    lineHeight: 24,
    marginBottom: 12,
  },
  importantSection: {
    alignItems: 'center',
    backgroundColor: COLORS.primaryExtraLight,
    borderRadius: 8,
    padding: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  importantTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  importantText: {
    fontSize: 16,
    color: COLORS.textDark,
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error,
    marginTop: 24,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
}); 