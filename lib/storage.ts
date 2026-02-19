import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER: '@runconquer_user',
  RUNS: '@runconquer_runs',
  TERRITORIES: '@runconquer_territories',
  ACHIEVEMENTS: '@runconquer_achievements',
  SETTINGS: '@runconquer_settings',
};

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  goal: string;
  country: string;
  state: string;
  xp: number;
  level: number;
  totalDistance: number;
  totalRuns: number;
  currentStreak: number;
  longestStreak: number;
  lastRunDate: string | null;
  territoryColor: string;
  createdAt: string;
}

export interface RunRecord {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  distance: number;
  avgPace: number;
  maxSpeed: number;
  path: { latitude: number; longitude: number }[];
  xpEarned: number;
  territoryGained: number;
  createdAt: string;
}

export interface Territory {
  id: string;
  userId: string;
  center: { latitude: number; longitude: number };
  radius: number;
  color: string;
  capturedAt: string;
  distance: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
  requirement: number;
  current: number;
  category: 'distance' | 'streak' | 'territory' | 'runs' | 'speed';
}

export async function saveUser(user: UserProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
}

export async function getUser(): Promise<UserProfile | null> {
  const data = await AsyncStorage.getItem(KEYS.USER);
  return data ? JSON.parse(data) : null;
}

export async function saveRuns(runs: RunRecord[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.RUNS, JSON.stringify(runs));
}

export async function getRuns(): Promise<RunRecord[]> {
  const data = await AsyncStorage.getItem(KEYS.RUNS);
  return data ? JSON.parse(data) : [];
}

export async function saveTerritories(territories: Territory[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.TERRITORIES, JSON.stringify(territories));
}

export async function getTerritories(): Promise<Territory[]> {
  const data = await AsyncStorage.getItem(KEYS.TERRITORIES);
  return data ? JSON.parse(data) : [];
}

export async function saveAchievements(achievements: Achievement[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
}

export async function getAchievements(): Promise<Achievement[]> {
  const data = await AsyncStorage.getItem(KEYS.ACHIEVEMENTS);
  return data ? JSON.parse(data) : [];
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}

export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function xpForLevel(level: number): number {
  return (level - 1) * (level - 1) * 100;
}

export function xpForNextLevel(level: number): number {
  return level * level * 100;
}

export function calculateXpFromRun(distance: number, duration: number): number {
  const distanceXp = Math.floor(distance * 10);
  const durationXp = Math.floor(duration / 60);
  return distanceXp + durationXp;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(2)}km`;
}

export function formatPace(metersPerSecond: number): string {
  if (metersPerSecond <= 0) return '--:--';
  const paceMinPerKm = 1000 / metersPerSecond / 60;
  const mins = Math.floor(paceMinPerKm);
  const secs = Math.round((paceMinPerKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const DEFAULT_ACHIEVEMENTS: Omit<Achievement, 'current'>[] = [
  { id: 'first_run', title: 'First Steps', description: 'Complete your first run', icon: 'walk', unlockedAt: null, requirement: 1, category: 'runs' },
  { id: 'run_5', title: 'Getting Started', description: 'Complete 5 runs', icon: 'trending-up', unlockedAt: null, requirement: 5, category: 'runs' },
  { id: 'run_25', title: 'Dedicated Runner', description: 'Complete 25 runs', icon: 'fitness', unlockedAt: null, requirement: 25, category: 'runs' },
  { id: 'run_100', title: 'Marathon Spirit', description: 'Complete 100 runs', icon: 'medal', unlockedAt: null, requirement: 100, category: 'runs' },
  { id: 'dist_1k', title: 'First Kilometer', description: 'Run a total of 1 km', icon: 'flag', unlockedAt: null, requirement: 1000, category: 'distance' },
  { id: 'dist_10k', title: 'Distance Demon', description: 'Run a total of 10 km', icon: 'flame', unlockedAt: null, requirement: 10000, category: 'distance' },
  { id: 'dist_50k', title: 'Ultra Runner', description: 'Run a total of 50 km', icon: 'flash', unlockedAt: null, requirement: 50000, category: 'distance' },
  { id: 'dist_100k', title: 'Centurion', description: 'Run a total of 100 km', icon: 'shield-checkmark', unlockedAt: null, requirement: 100000, category: 'distance' },
  { id: 'streak_3', title: 'Hat Trick', description: '3-day running streak', icon: 'bonfire', unlockedAt: null, requirement: 3, category: 'streak' },
  { id: 'streak_7', title: 'Weekly Warrior', description: '7-day running streak', icon: 'star', unlockedAt: null, requirement: 7, category: 'streak' },
  { id: 'streak_30', title: 'Iron Will', description: '30-day running streak', icon: 'trophy', unlockedAt: null, requirement: 30, category: 'streak' },
  { id: 'territory_1', title: 'Land Claim', description: 'Capture your first territory', icon: 'map', unlockedAt: null, requirement: 1, category: 'territory' },
  { id: 'territory_10', title: 'Territory Baron', description: 'Capture 10 territories', icon: 'globe', unlockedAt: null, requirement: 10, category: 'territory' },
  { id: 'territory_50', title: 'Conqueror', description: 'Capture 50 territories', icon: 'earth', unlockedAt: null, requirement: 50, category: 'territory' },
];

export const LEADERBOARD_DATA = [
  { rank: 1, username: 'SpeedDemon', level: 42, xp: 176400, distance: 892.5, territories: 156, country: 'US', avatar: 'avatar_1' },
  { rank: 2, username: 'TrailBlazer', level: 38, xp: 144400, distance: 754.2, territories: 132, country: 'UK', avatar: 'avatar_2' },
  { rank: 3, username: 'RunLikeWind', level: 35, xp: 122500, distance: 681.8, territories: 118, country: 'DE', avatar: 'avatar_3' },
  { rank: 4, username: 'MileChaser', level: 33, xp: 108900, distance: 623.4, territories: 105, country: 'JP', avatar: 'avatar_4' },
  { rank: 5, username: 'GroundTaker', level: 31, xp: 96100, distance: 567.1, territories: 94, country: 'AU', avatar: 'avatar_5' },
  { rank: 6, username: 'PaceKing', level: 29, xp: 84100, distance: 512.9, territories: 87, country: 'CA', avatar: 'avatar_6' },
  { rank: 7, username: 'AsphaltHero', level: 27, xp: 72900, distance: 478.3, territories: 79, country: 'FR', avatar: 'avatar_1' },
  { rank: 8, username: 'ZoneCaptor', level: 25, xp: 62500, distance: 421.7, territories: 68, country: 'BR', avatar: 'avatar_2' },
  { rank: 9, username: 'StreetOwner', level: 23, xp: 52900, distance: 378.6, territories: 55, country: 'IN', avatar: 'avatar_3' },
  { rank: 10, username: 'PathFinder', level: 21, xp: 44100, distance: 334.2, territories: 47, country: 'KR', avatar: 'avatar_4' },
];

export const COUNTRIES = [
  'United States', 'United Kingdom', 'Germany', 'Japan', 'Australia',
  'Canada', 'France', 'Brazil', 'India', 'South Korea', 'Spain',
  'Italy', 'Mexico', 'Netherlands', 'Sweden', 'Norway', 'Finland',
  'Denmark', 'Switzerland', 'Austria', 'Belgium', 'Portugal',
  'Poland', 'Czech Republic', 'Ireland', 'New Zealand', 'Singapore',
  'Thailand', 'Vietnam', 'Philippines', 'Indonesia', 'Malaysia',
  'South Africa', 'Nigeria', 'Kenya', 'Egypt', 'Morocco',
  'Argentina', 'Chile', 'Colombia', 'Peru',
];

export const GOALS = [
  { id: 'casual', label: 'Casual Runner', icon: 'walk-outline', desc: 'Run for fun and health' },
  { id: 'competitor', label: 'Competitor', icon: 'trophy-outline', desc: 'Climb the leaderboards' },
  { id: 'explorer', label: 'Explorer', icon: 'compass-outline', desc: 'Discover new territories' },
  { id: 'warrior', label: 'Territory Warrior', icon: 'shield-outline', desc: 'Conquer and defend' },
];

export const AVATAR_COLORS = [
  '#E8952E', '#FF6B35', '#34C759', '#5AC8FA', '#AF52DE',
  '#FF453A', '#FFD60A', '#4A90D9', '#FF2D55', '#00C7BE',
];
