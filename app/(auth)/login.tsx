import { useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<TextInput>(null);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function handleContinue() {
    if (!isValidEmail) {
      setError('Please enter a valid email');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    setError('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const response = await fetch('http://10.117.110.78:5000/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }
      
      router.push({ pathname: '/(auth)/verify', params: { email } });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send verification code');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <LinearGradient
        colors={['#E8952E', '#C67A1A', '#1A1A1A', '#0D0D0D']}
        locations={[0, 0.15, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="navigate" size={40} color={Colors.background} />
        </View>
        <Text style={styles.title}>RunConquer</Text>
        <Text style={styles.subtitle}>Claim your territory. One run at a time.</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.form}>
        <Text style={styles.label}>Email Address</Text>
        <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
          <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor={Colors.textTertiary}
            value={email}
            onChangeText={(t) => { setEmail(t); setError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={handleContinue}
          />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            !isValidEmail && styles.buttonDisabled,
            pressed && isValidEmail && styles.buttonPressed,
          ]}
          onPress={handleContinue}
          disabled={!isValidEmail}>
          <Text style={styles.buttonText}>Send 6-Digit Code</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </Pressable>

        <Text style={styles.disclaimer}>
          We'll send a 6-digit code to verify your email
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(600).duration(600)} style={[styles.footer, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 16 }]}>
        <View style={styles.featureRow}>
          <View style={styles.featureItem}>
            <Ionicons name="map" size={24} color={Colors.primary} />
            <Text style={styles.featureText}>Claim Territory</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="trophy" size={24} color={Colors.primary} />
            <Text style={styles.featureText}>Compete</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="flash" size={24} color={Colors.primary} />
            <Text style={styles.featureText}>Level Up</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 36,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  label: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 8,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: Colors.text,
  },
  errorText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: Colors.danger,
    marginBottom: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 56,
    marginTop: 16,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  disclaimer: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  featureItem: {
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
