import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { COUNTRIES, GOALS, AVATAR_COLORS } from '@/lib/storage';

type Step = 'username' | 'avatar' | 'goal' | 'location';

export default function SetupScreen() {
  const insets = useSafeAreaInsets();
  const { completeProfile } = useAuth();
  const [step, setStep] = useState<Step>('username');
  const [username, setUsername] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [goal, setGoal] = useState('');
  const [country, setCountry] = useState('');
  const [bio, setBio] = useState('');
  const [usernameError, setUsernameError] = useState('');

  function nextStep() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (step) {
      case 'username':
        if (username.length < 3) {
          setUsernameError('Username must be at least 3 characters');
          return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          setUsernameError('Only letters, numbers, and underscores');
          return;
        }
        setStep('avatar');
        break;
      case 'avatar':
        setStep('goal');
        break;
      case 'goal':
        if (!goal) return;
        setStep('location');
        break;
      case 'location':
        finishSetup();
        break;
    }
  }

  function prevStep() {
    switch (step) {
      case 'avatar': setStep('username'); break;
      case 'goal': setStep('avatar'); break;
      case 'location': setStep('goal'); break;
    }
  }

  async function finishSetup() {
    await completeProfile({
      username,
      avatar: avatarColor,
      goal,
      country,
      bio,
      territoryColor: avatarColor,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)');
  }

  const stepIndex = ['username', 'avatar', 'goal', 'location'].indexOf(step);

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <View style={styles.topBar}>
        {step !== 'username' ? (
          <Pressable onPress={prevStep} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </Pressable>
        ) : <View style={{ width: 44 }} />}
        <View style={styles.progressRow}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={[styles.progressDot, i <= stepIndex && styles.progressDotActive]} />
          ))}
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {step === 'username' && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose your username</Text>
            <Text style={styles.stepDesc}>This is how other runners will see you</Text>
            <View style={[styles.inputWrapper, usernameError ? styles.inputError : null]}>
              <Text style={styles.atSign}>@</Text>
              <TextInput
                style={styles.input}
                placeholder="Choose a username"
                placeholderTextColor={Colors.textTertiary}
                value={username}
                onChangeText={(t) => { setUsername(t.toLowerCase()); setUsernameError(''); }}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
              />
            </View>
            {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}
            <Text style={styles.hint}>{username.length}/20 characters</Text>

            <Text style={styles.bioLabel}>Bio (optional)</Text>
            <TextInput
              style={styles.bioInput}
              placeholder="Share your fitness journey..."
              placeholderTextColor={Colors.textTertiary}
              value={bio}
              onChangeText={setBio}
              multiline
              maxLength={100}
              textAlignVertical="top"
            />
          </Animated.View>
        )}

        {step === 'avatar' && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContent}>
            <Text style={styles.stepTitle}>Pick your color</Text>
            <Text style={styles.stepDesc}>This will be your territory color on the map</Text>

            <View style={styles.avatarPreview}>
              <View style={[styles.avatarCircle, { backgroundColor: avatarColor }]}>
                <Text style={styles.avatarInitial}>
                  {username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.avatarUsername}>@{username}</Text>
            </View>

            <View style={styles.colorGrid}>
              {AVATAR_COLORS.map(color => (
                <Pressable
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    avatarColor === color && styles.colorSelected,
                  ]}
                  onPress={() => {
                    setAvatarColor(color);
                    Haptics.selectionAsync();
                  }}
                >
                  {avatarColor === color && (
                    <Ionicons name="checkmark" size={24} color="#fff" />
                  )}
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        {step === 'goal' && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContent}>
            <Text style={styles.stepTitle}>What drives you?</Text>
            <Text style={styles.stepDesc}>Choose your running motivation</Text>

            <View style={styles.goalList}>
              {GOALS.map(g => (
                <Pressable
                  key={g.id}
                  style={[styles.goalCard, goal === g.id && styles.goalCardActive]}
                  onPress={() => {
                    setGoal(g.id);
                    Haptics.selectionAsync();
                  }}
                >
                  <View style={[styles.goalIcon, goal === g.id && styles.goalIconActive]}>
                    <Ionicons
                      name={g.icon as any}
                      size={28}
                      color={goal === g.id ? Colors.background : Colors.textSecondary}
                    />
                  </View>
                  <View style={styles.goalText}>
                    <Text style={[styles.goalLabel, goal === g.id && styles.goalLabelActive]}>
                      {g.label}
                    </Text>
                    <Text style={styles.goalDesc}>{g.desc}</Text>
                  </View>
                  {goal === g.id && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                  )}
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        {step === 'location' && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContent}>
            <Text style={styles.stepTitle}>Where are you from?</Text>
            <Text style={styles.stepDesc}>For regional leaderboards</Text>

            <ScrollView style={styles.countryList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {COUNTRIES.map(c => (
                <Pressable
                  key={c}
                  style={[styles.countryItem, country === c && styles.countryItemActive]}
                  onPress={() => {
                    setCountry(c);
                    Haptics.selectionAsync();
                  }}
                >
                  <Text style={[styles.countryText, country === c && styles.countryTextActive]}>
                    {c}
                  </Text>
                  {country === c && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.nextBtn,
            (step === 'goal' && !goal) && styles.nextBtnDisabled,
            pressed && styles.nextBtnPressed,
          ]}
          onPress={nextStep}
          disabled={step === 'goal' && !goal}
        >
          <Text style={styles.nextBtnText}>
            {step === 'location' ? "Let's Go!" : 'Continue'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </Pressable>

        {step === 'location' && !country && (
          <Pressable onPress={finishSetup} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
  },
  progressDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  stepContent: {
    paddingTop: 16,
  },
  stepTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 28,
    color: Colors.text,
    marginBottom: 8,
  },
  stepDesc: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 32,
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
  atSign: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    color: Colors.primary,
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontFamily: 'Outfit_500Medium',
    fontSize: 18,
    color: Colors.text,
  },
  errorText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: Colors.danger,
    marginBottom: 4,
  },
  hint: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: Colors.textTertiary,
    marginBottom: 24,
  },
  bioLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bioInput: {
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: Colors.text,
    height: 80,
  },
  avatarPreview: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarInitial: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 40,
    color: '#fff',
  },
  avatarUsername: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    color: Colors.text,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
  },
  colorOption: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  goalList: {
    gap: 12,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  goalCardActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(232, 149, 46, 0.08)',
  },
  goalIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  goalIconActive: {
    backgroundColor: Colors.primary,
  },
  goalText: {
    flex: 1,
  },
  goalLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: Colors.text,
    marginBottom: 2,
  },
  goalLabelActive: {
    color: Colors.primary,
  },
  goalDesc: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  countryList: {
    maxHeight: 340,
    marginBottom: 16,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  countryItemActive: {
    backgroundColor: 'rgba(232, 149, 46, 0.1)',
  },
  countryText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 16,
    color: Colors.text,
  },
  countryTextActive: {
    color: Colors.primary,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 56,
    marginTop: 24,
    gap: 8,
  },
  nextBtnDisabled: {
    opacity: 0.4,
  },
  nextBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  nextBtnText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  skipBtn: {
    alignItems: 'center',
    padding: 16,
  },
  skipText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: Colors.textTertiary,
  },
});
