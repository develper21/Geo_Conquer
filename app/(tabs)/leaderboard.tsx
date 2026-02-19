import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { LEADERBOARD_DATA, formatDistance } from '@/lib/storage';

type Tab = 'global' | 'territory' | 'xp';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function TopThreeCard({ entry, position }: { entry: typeof LEADERBOARD_DATA[0]; position: number }) {
  const sizes = [{ size: 72, ring: 82 }, { size: 60, ring: 70 }, { size: 56, ring: 66 }];
  const colors = [Colors.xpGold, '#C0C0C0', '#CD7F32'];
  const s = sizes[position];
  const c = colors[position];

  return (
    <View style={[styles.topCard, position === 0 && styles.topCardFirst]}>
      <View style={[styles.topRing, { width: s.ring, height: s.ring, borderColor: c }]}>
        <View style={[styles.topAvatar, { width: s.size, height: s.size, backgroundColor: Colors.primary }]}>
          <Text style={[styles.topInitial, { fontSize: s.size * 0.4 }]}>
            {entry.username.charAt(0)}
          </Text>
        </View>
      </View>
      <View style={[styles.rankBadge, { backgroundColor: c }]}>
        <Text style={styles.rankBadgeText}>{position + 1}</Text>
      </View>
      <Text style={styles.topName} numberOfLines={1}>{entry.username}</Text>
      <Text style={styles.topStat}>{formatDistance(entry.distance * 1000)}</Text>
    </View>
  );
}

function LeaderboardRow({ entry, index }: { entry: typeof LEADERBOARD_DATA[0]; index: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)} style={styles.row}>
      <Text style={styles.rowRank}>{entry.rank}</Text>
      <View style={[styles.rowAvatar, { backgroundColor: Colors.primary }]}>
        <Text style={styles.rowInitial}>{entry.username.charAt(0)}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{entry.username}</Text>
        <Text style={styles.rowCountry}>{entry.country}</Text>
      </View>
      <View style={styles.rowStats}>
        <Text style={styles.rowLevel}>Lv.{entry.level}</Text>
        <Text style={styles.rowDistance}>{formatDistance(entry.distance * 1000)}</Text>
      </View>
    </Animated.View>
  );
}

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('global');

  const sortedData = [...LEADERBOARD_DATA].sort((a, b) => {
    if (activeTab === 'territory') return b.territories - a.territories;
    if (activeTab === 'xp') return b.xp - a.xp;
    return b.distance - a.distance;
  });

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'global', label: 'Distance', icon: 'footsteps' },
    { key: 'territory', label: 'Territory', icon: 'map' },
    { key: 'xp', label: 'XP', icon: 'flash' },
  ];

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
        <Text style={styles.screenTitle}>Leaderboard</Text>

        <View style={styles.tabRow}>
          {tabs.map(tab => (
            <Pressable
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => {
                setActiveTab(tab.key);
                Haptics.selectionAsync();
              }}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={activeTab === tab.key ? Colors.background : Colors.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.topThree}>
          <TopThreeCard entry={sortedData[1]} position={1} />
          <TopThreeCard entry={sortedData[0]} position={0} />
          <TopThreeCard entry={sortedData[2]} position={2} />
        </View>

        {user && (
          <View style={styles.yourRank}>
            <LinearGradient
              colors={[Colors.primary + '20', Colors.primary + '05']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.yourRankContent}>
              <View style={styles.yourRankLeft}>
                <Text style={styles.yourRankLabel}>Your Rank</Text>
                <Text style={styles.yourRankNumber}>#{sortedData.length + 1}</Text>
              </View>
              <View style={styles.yourRankRight}>
                <View style={[styles.rowAvatar, { backgroundColor: user.territoryColor || Colors.primary }]}>
                  <Text style={styles.rowInitial}>{(user.username || 'U').charAt(0).toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.rowName}>@{user.username}</Text>
                  <Text style={styles.rowDistance}>{formatDistance(user.totalDistance)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.listSection}>
          {sortedData.slice(3).map((entry, i) => (
            <LeaderboardRow key={entry.rank} entry={entry} index={i} />
          ))}
        </View>
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
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.card,
    gap: 6,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.background,
  },
  topThree: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 24,
    gap: 12,
  },
  topCard: {
    alignItems: 'center',
    flex: 1,
  },
  topCardFirst: {
    marginBottom: 16,
  },
  topRing: {
    borderRadius: 100,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  topAvatar: {
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topInitial: {
    fontFamily: 'Outfit_700Bold',
    color: '#fff',
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -16,
    marginBottom: 4,
  },
  rankBadgeText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 12,
    color: Colors.background,
  },
  topName: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    color: Colors.text,
    marginBottom: 2,
  },
  topStat: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  yourRank: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  yourRankContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  yourRankLeft: {
    gap: 2,
  },
  yourRankLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  yourRankNumber: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 28,
    color: Colors.primary,
  },
  yourRankRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listSection: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 12,
  },
  rowRank: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 16,
    color: Colors.textTertiary,
    width: 28,
    textAlign: 'center',
  },
  rowAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowInitial: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 16,
    color: '#fff',
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: Colors.text,
  },
  rowCountry: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  rowStats: {
    alignItems: 'flex-end',
  },
  rowLevel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    color: Colors.primary,
  },
  rowDistance: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
