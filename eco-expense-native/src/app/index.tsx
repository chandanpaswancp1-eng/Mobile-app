import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { User, RefreshCw, Send, Camera, Zap } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from '../constants/Theme';

export default function HomeScreen() {
  const [userName, setUserName] = useState('User');
  const [balance, setBalance] = useState('0.00');

  useEffect(() => {
    // Load from AsyncStorage later
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Hello, {userName} 👋</Text>
            <Text style={styles.subtitle}>Here are your recent expenses</Text>
          </View>
          <TouchableOpacity style={styles.profileIcon}>
            <User size={24} color={Theme.colors.accentNeon} />
          </TouchableOpacity>
        </View>

        {/* Credit Card */}
        <View style={styles.creditCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardLabel}>TOTAL SPENT</Text>
              <Text style={styles.cardBalance}>$ {balance}</Text>
            </View>
            <Zap size={24} color={Theme.colors.accentNeon} />
          </View>
          
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.btnOutline}>
              <RefreshCw size={16} color={Theme.colors.textPrimary} />
              <Text style={styles.btnOutlineText}>Sync Bank</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnPrimary}>
              <Send size={16} color="#000" />
              <Text style={styles.btnPrimaryText}>Send Money</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scan Receipt */}
        <TouchableOpacity style={styles.scanBtn}>
          <Camera size={20} color={Theme.colors.accentNeon} />
          <Text style={styles.scanBtnText}>Scan Receipt</Text>
        </TouchableOpacity>

        {/* Recent Activity */}
        <View style={styles.activityHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No recent expenses</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    padding: Theme.spacing.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creditCard: {
    backgroundColor: '#0f172a',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginBottom: Theme.spacing.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
    fontWeight: '600',
  },
  cardBalance: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: Theme.spacing.xl,
    gap: Theme.spacing.md,
  },
  btnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Theme.colors.surfaceBorder,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 8,
  },
  btnOutlineText: {
    color: Theme.colors.textPrimary,
    fontWeight: '600',
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.accentPrimary,
    gap: 8,
  },
  btnPrimaryText: {
    color: '#000',
    fontWeight: '700',
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.accentNeon,
    marginBottom: Theme.spacing.xl,
    gap: 8,
  },
  scanBtnText: {
    color: Theme.colors.accentNeon,
    fontWeight: '600',
    fontSize: 16,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  clearText: {
    color: Theme.colors.textMuted,
    fontSize: 14,
  },
  emptyState: {
    padding: Theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: Theme.colors.textMuted,
  }
});
