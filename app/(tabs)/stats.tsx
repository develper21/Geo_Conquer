import { View, Text, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { formatDistance, xpForNextLevel } from '@/lib/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function StatCard({ icon, label, value, color, delay }: {
  icon: string; label: string; value: string; color: string; delay: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

function WeekChart({ data }: { data: number[] }) {
  const maxVal = Math.max(...data, 1);
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartBars}>
        {data.map((val, i) => {
          const height = (val / maxVal) * 120;
          return (
            <View key={i} style={styles.chartBarColumn}>
              <View style={styles.chartBarTrack}>
                <LinearGradient
                  colors={[Colors.primary, Colors.accent]}
                  style={[styles.chartBar, { height: Math.max(height, 4) }]}
                />
              </View>
              <Text style={styles.chartDayLabel}>{days[i]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { runs, territories, weeklyRuns, todayDistance, weeklyDistance } = useGame();

  const weeklyData = (() => {
    const data = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    weeklyRuns.forEach(run => {
      const runDate = new Date(run.createdAt);
      const dayDiff = Math.floor((now.getTime() - runDate.getTime()) / (1000 * 60 * 60 * 24));
      const dayIndex = 6 - dayDiff;
      if (dayIndex >= 0 && dayIndex < 7) {
        data[dayIndex] += run.distance;
      }
    });
    return data;
  })();

  const totalDuration = runs.reduce((sum, r) => sum + r.duration, 0);
  const avgPace = runs.length > 0
    ? (user?.totalDistance || 0) / totalDuration
    : 0;

  const xpProgress = user ? (user.xp - (user.level - 1) * (user.level - 1) * 100) / (xpForNextLevel(user.level) - (user.level - 1) * (user.level - 1) * 100) : 0;

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
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={styles.screenTitle}>Your Stats</Text>

          <View style={styles.levelCard}>
            <LinearGradient
              colors={['rgba(232,149,46,0.15)', 'rgba(232,149,46,0.03)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.levelTop}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelNumber}>{user?.level || 1}</Text>
              </View>
              <View style={styles.levelInfo}>
                <Text style={styles.levelTitle}>Level {user?.level || 1}</Text>
                <Text style={styles.xpText}>{user?.xp || 0} XP</Text>
              </View>
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={18} color={Colors.accent} />
                <Text style={styles.streakText}>{user?.currentStreak || 0}</Text>
              </View>
            </View>
            <View style={styles.xpBarOuter}>
              <View style={[styles.xpBarInner, { width: `${Math.min(xpProgress * 100, 100)}%` }]} />
            </View>
            <Text style={styles.xpRemaining}>
              {Math.max(0, xpForNextLevel(user?.level || 1) - (user?.xp || 0))} XP to next level
            </Text>
          </View>
        </Animated.View>

        <View style={styles.statsGrid}>
          <StatCard icon="footsteps" label="Total Distance" value={formatDistance(user?.totalDistance || 0)} color={Colors.primary} delay={200} />
          <StatCard icon="fitness" label="Total Runs" value={`${user?.totalRuns || 0}`} color={Colors.success} delay={250} />
          <StatCard icon="map" label="Territories" value={`${territories.length}`} color={Colors.territoryBlue} delay={300} />
          <StatCard icon="flame" label="Best Streak" value={`${user?.longestStreak || 0}d`} color={Colors.accent} delay={350} />
        </View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.weekCard}>
            <View style={styles.weekStats}>
              <View style={styles.weekStatItem}>
                <Text style={styles.weekStatValue}>{formatDistance(weeklyDistance)}</Text>
                <Text style={styles.weekStatLabel}>Distance</Text>
              </View>
              <View style={styles.weekStatDivider} />
              <View style={styles.weekStatItem}>
                <Text style={styles.weekStatValue}>{weeklyRuns.length}</Text>
                <Text style={styles.weekStatLabel}>Runs</Text>
              </View>
              <View style={styles.weekStatDivider} />
              <View style={styles.weekStatItem}>
                <Text style={styles.weekStatValue}>{formatDistance(todayDistance)}</Text>
                <Text style={styles.weekStatLabel}>Today</Text>
              </View>
            </View>
            <WeekChart data={weeklyData} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Runs</Text>
          {runs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="walk-outline" size={40} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>No runs yet. Start your first run!</Text>
            </View>
          ) : (
            runs.slice(0, 5).map((run, i) => (
              <View key={run.id} style={styles.runItem}>
                <View style={styles.runLeft}>
                  <View style={styles.runIconWrap}>
                    <Ionicons name="navigate" size={18} color={Colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.runDistance}>{formatDistance(run.distance)}</Text>
                    <Text style={styles.runDate}>
                      {new Date(run.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                </View>
                <View style={styles.runRight}>
                  <Text style={styles.runXp}>+{run.xpEarned} XP</Text>
                  <Text style={styles.runDuration}>
                    {Math.floor(run.duration / 60)}m {Math.floor(run.duration % 60)}s
                  </Text>
                </View>
              </View>
            ))
          )}
        </Animated.View>
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
  screenTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 32,
    color: Colors.text,
    marginBottom: 20,
  },
  levelCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  levelTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  levelNumber: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: '#fff',
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 18,
    color: Colors.text,
  },
  xpText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: Colors.primary,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundTertiary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  streakText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 16,
    color: Colors.accent,
  },
  xpBarOuter: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.backgroundTertiary,
    marginBottom: 8,
  },
  xpBarInner: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  xpRemaining: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: Colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 20,
    color: Colors.text,
    marginBottom: 12,
  },
  weekCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
  },
  weekStats: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  weekStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  weekStatValue: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 20,
    color: Colors.text,
  },
  weekStatLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  weekStatDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  chartContainer: {
    height: 160,
  },
  chartBars: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 24,
  },
  chartBarColumn: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarTrack: {
    width: 24,
    justifyContent: 'flex-end',
    borderRadius: 6,
    overflow: 'hidden',
  },
  chartBar: {
    width: 24,
    borderRadius: 6,
    minHeight: 4,
  },
  chartDayLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 8,
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
  runItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  runLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  runIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  runDistance: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: Colors.text,
  },
  runDate: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  runRight: {
    alignItems: 'flex-end',
  },
  runXp: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: Colors.xpGold,
  },
  runDuration: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
