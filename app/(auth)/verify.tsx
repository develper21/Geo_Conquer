import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

const CODE_LENGTH = 6;

export default function VerifyScreen() {
  const insets = useSafeAreaInsets();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { login } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => c > 0 ? c - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  async function handleVerify() {
    if (code.length < CODE_LENGTH) {
      setError(`Please enter the full ${CODE_LENGTH}-digit code`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsVerifying(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Call API to verify code
      const response = await fetch('http://10.117.110.78:5000/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email || '', code }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.verified) {
        throw new Error(data.error || 'Invalid verification code');
      }
      
      // If verification successful, login and navigate
      await login(email || '');
      router.replace('/(auth)/setup');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Verification failed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsVerifying(false);
    }
  }

  function handleCodeChange(text: string) {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH);
    setCode(cleaned);
    setError('');
    if (cleaned.length === CODE_LENGTH) {
      inputRef.current?.blur();
    }
  }

  const codeDigits = code.split('').concat(Array(CODE_LENGTH - code.length).fill(''));

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color={Colors.text} />
      </Pressable>

      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark" size={36} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Verification</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={styles.emailText}>{email}</Text>
        </Text>

        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={code}
          onChangeText={handleCodeChange}
          keyboardType="number-pad"
          maxLength={CODE_LENGTH}
          autoFocus
        />

        <Pressable style={styles.codeRow} onPress={() => inputRef.current?.focus()}>
          {codeDigits.map((digit, i) => (
            <View
              key={i}
              style={[
                styles.codeBox,
                i === code.length && styles.codeBoxActive,
                digit && styles.codeBoxFilled,
              ]}
            >
              <Text style={[styles.codeDigit, digit && styles.codeDigitFilled]}>
                {digit || ''}
              </Text>
            </View>
          ))}
        </Pressable>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.verifyBtn,
            code.length < CODE_LENGTH && styles.btnDisabled,
            pressed && code.length === CODE_LENGTH && styles.btnPressed,
          ]}
          onPress={handleVerify}
          disabled={code.length < CODE_LENGTH || isVerifying}
        >
          <Text style={styles.verifyText}>
            {isVerifying ? 'Verifying...' : 'Verify & Continue'}
          </Text>
        </Pressable>

        <Pressable
          style={styles.resendBtn}
          disabled={countdown > 0}
          onPress={async () => {
            if (countdown > 0) return;
            
            try {
              const response = await fetch('http://10.117.110.78:5000/api/auth/send-verification', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email || '' }),
              });
              
              const data = await response.json();
              
              if (!response.ok) {
                throw new Error(data.error || 'Failed to resend code');
              }
              
              setCountdown(30);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setError('');
            } catch (error) {
              setError(error instanceof Error ? error.message : 'Failed to resend code');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
          }}
        >
          <Text style={[styles.resendText, countdown > 0 && styles.resendDisabled]}>
            {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginTop: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    alignItems: 'center',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 28,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emailText: {
    fontFamily: 'Outfit_600SemiBold',
    color: Colors.primary,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  codeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 24,
  },
  codeBox: {
    width: 40,
    height: 52,
    borderRadius: 10,
    backgroundColor: Colors.backgroundTertiary,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeBoxActive: {
    borderColor: Colors.primary,
  },
  codeBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.backgroundSecondary,
  },
  codeDigit: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: Colors.textTertiary,
  },
  codeDigitFilled: {
    color: Colors.text,
  },
  errorText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: Colors.danger,
    marginBottom: 16,
  },
  verifyBtn: {
    width: '100%',
    height: 56,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  verifyText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  resendBtn: {
    padding: 12,
  },
  resendText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: Colors.primary,
  },
  resendDisabled: {
    color: Colors.textTertiary,
  },
});
