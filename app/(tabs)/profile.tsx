import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { formatDistance, xpForNextLevel, GOALS } from '@/lib/storage';

function AchievementCard({ achievement, index }: { achievement: any; index: number }) {
  const isUnlocked = !!achievement.unlockedAt;
  const progress = Math.min(achievement.current / achievement.requirement, 1);

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(300)} style={[styles.achievementCard, !isUnlocked && styles.achievementLocked]}>
      <View style={[styles.achievementIcon, isUnlocked && styles.achievementIconUnlocked]}>
        <Ionicons
          name={achievement.icon as any}
          size={22}
          color={isUnlocked ? Colors.xpGold : Colors.textTertiary}
        />
      </View>
      <View style={styles.achievementInfo}>
        <Text style={[styles.achievementTitle, !isUnlocked && styles.achievementTitleLocked]}>
          {achievement.title}
        </Text>
        <Text style={styles.achievementDesc}>{achievement.description}</Text>
        <View style={styles.achievementBar}>
          <View style={[styles.achievementBarFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>
      {isUnlocked && <Ionicons name="checkmark-circle" size={22} color={Colors.success} />}
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { achievements, territories, runs } = useGame();
  const [activeSection, setActiveSection] = useState<'achievements' | 'history'>('achievements');

  const goalInfo = GOALS.find(g => g.id === user?.goal);
  const unlockedCount = achievements.filter(a => a.unlockedAt).length;
  const xpProgress = user ? (user.xp - (user.level - 1) * (user.level - 1) * 100) / (xpForNextLevel(user.level) - (user.level - 1) * (user.level - 1) * 100) : 0;

  function handleLogout() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your data will be cleared.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, {
          paddingTop: Platform.OS === 'web' ? 67 + 16 : insets.top + 16,
          paddingBottom: Platform.OS === 'web' ? 34 + 60 : insets.bottom + 100,
        }]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Text style={styles.screenTitle}>Profile</Text>
          <Pressable onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color={Colors.danger} />
          </Pressable>
        </View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.profileCard}>
          <LinearGradient
            colors={[user?.territoryColor + '30' || Colors.primary + '30', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.profileTop}>
            <View style={[styles.avatar, { backgroundColor: user?.territoryColor || Colors.primary }]}>
              <Text style={styles.avatarText}>
                {(user?.username || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.username}>@{user?.username}</Text>
              <View style={styles.goalRow}>
                <Ionicons name={goalInfo?.icon as any || 'flag'} size={14} color={Colors.primary} />
                <Text style={styles.goalText}>{goalInfo?.label || 'Runner'}</Text>
              </View>
              {user?.country ? <Text style={styles.countryText}>{user.country}</Text> : null}
            </View>
          </View>
          {user?.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

          <View style={styles.profileStats}>
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatValue}>Lv.{user?.level || 1}</Text>
              <Text style={styles.profileStatLabel}>Level</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatValue}>{formatDistance(user?.totalDistance || 0)}</Text>
              <Text style={styles.profileStatLabel}>Distance</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatValue}>{territories.length}</Text>
              <Text style={styles.profileStatLabel}>Zones</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatValue}>{user?.currentStreak || 0}</Text>
              <Text style={styles.profileStatLabel}>Streak</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.xpSection}>
          <View style={styles.xpHeader}>
            <Text style={styles.xpTitle}>{user?.xp || 0} XP</Text>
            <Text style={styles.xpTarget}>Next: {xpForNextLevel(user?.level || 1)} XP</Text>
          </View>
          <View style={styles.xpBarOuter}>
            <LinearGradient
              colors={[Colors.primary, Colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.xpBarInner, { width: `${Math.min(xpProgress * 100, 100)}%` }]}
            />
          </View>
        </View>

        <View style={styles.sectionTabs}>
          <Pressable
            style={[styles.sectionTab, activeSection === 'achievements' && styles.sectionTabActive]}
            onPress={() => {
              setActiveSection('achievements');
              Haptics.selectionAsync();
            }}
          >
            <Ionicons name="trophy" size={18} color={activeSection === 'achievements' ? Colors.primary : Colors.textTertiary} />
            <Text style={[styles.sectionTabText, activeSection === 'achievements' && styles.sectionTabTextActive]}>
              Achievements ({unlockedCount}/{achievements.length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.sectionTab, activeSection === 'history' && styles.sectionTabActive]}
            onPress={() => {
              setActiveSection('history');
              Haptics.selectionAsync();
            }}
          >
            <Ionicons name="time" size={18} color={activeSection === 'history' ? Colors.primary : Colors.textTertiary} />
            <Text style={[styles.sectionTabText, activeSection === 'history' && styles.sectionTabTextActive]}>
              History
            </Text>
          </Pressable>
        </View>

        {activeSection === 'achievements' ? (
          <View style={styles.achievementsList}>
            {achievements.map((a, i) => (
              <AchievementCard key={a.id} achievement={a} index={i} />
            ))}
          </View>
        ) : (
          <View style={styles.historyList}>
            {runs.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="walk-outline" size={40} color={Colors.textTertiary} />
                <Text style={styles.emptyText}>No run history yet</Text>
              </View>
            ) : (
              runs.map((run, i) => (
                <Animated.View key={run.id} entering={FadeInDown.delay(i * 40).duration(300)} style={styles.historyItem}>
                  <View style={styles.historyLeft}>
                    <View style={styles.historyDot} />
                    <View>
                      <Text style={styles.historyDistance}>{formatDistance(run.distance)}</Text>
                      <Text style={styles.historyDate}>
                        {new Date(run.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.historyXp}>+{run.xpEarned} XP</Text>
                    <View style={styles.historyMeta}>
                      <Ionicons name="time-outline" size={12} color={Colors.textTertiary} />
                      <Text style={styles.historyMetaText}>
                        {Math.floor(run.duration / 60)}m
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              ))
            )}
          </View>
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
  scrollContent: {
    paddingHorizontal: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  screenTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 32,
    color: Colors.text,
  },
  logoutBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 28,
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: Colors.text,
    marginBottom: 4,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  goalText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: Colors.primary,
  },
  countryText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bio: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  profileStats: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 14,
    padding: 14,
  },
  profileStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  profileStatValue: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 18,
    color: Colors.text,
  },
  profileStatLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  profileStatDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  xpSection: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  xpTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 16,
    color: Colors.xpGold,
  },
  xpTarget: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  xpBarOuter: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.backgroundTertiary,
    overflow: 'hidden',
  },
  xpBarInner: {
    height: 10,
    borderRadius: 5,
  },
  sectionTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  sectionTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.card,
    gap: 6,
  },
  sectionTabActive: {
    backgroundColor: Colors.primary + '18',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  sectionTabText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: Colors.textTertiary,
  },
  sectionTabTextActive: {
    color: Colors.primary,
  },
  achievementsList: {
    gap: 8,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementIconUnlocked: {
    backgroundColor: Colors.xpGold + '20',
  },
  achievementInfo: {
    flex: 1,
    marginRight: 8,
  },
  achievementTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: Colors.text,
    marginBottom: 2,
  },
  achievementTitleLocked: {
    color: Colors.textSecondary,
  },
  achievementDesc: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  achievementBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.backgroundTertiary,
  },
  achievementBarFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  historyDistance: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: Colors.text,
  },
  historyDate: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyXp: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: Colors.xpGold,
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyMetaText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: Colors.textTertiary,
  },
  emptyState: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
