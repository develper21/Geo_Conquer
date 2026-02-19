import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import {
  RunRecord, Territory, Achievement,
  getRuns, saveRuns, getTerritories, saveTerritories,
  getAchievements, saveAchievements, generateId,
  calculateXpFromRun, calculateLevel, DEFAULT_ACHIEVEMENTS,
} from '@/lib/storage';
import { useAuth } from './AuthContext';

interface GameContextValue {
  runs: RunRecord[];
  territories: Territory[];
  achievements: Achievement[];
  isLoading: boolean;
  addRun: (run: Omit<RunRecord, 'id' | 'createdAt' | 'xpEarned' | 'territoryGained'>) => Promise<RunRecord>;
  addTerritory: (territory: Omit<Territory, 'id' | 'capturedAt'>) => Promise<void>;
  weeklyRuns: RunRecord[];
  todayDistance: number;
  weeklyDistance: number;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const { user, updateUser } = useAuth();
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [r, t, a] = await Promise.all([getRuns(), getTerritories(), getAchievements()]);
      setRuns(r);
      setTerritories(t);
      if (a.length === 0) {
        const defaults = DEFAULT_ACHIEVEMENTS.map(d => ({ ...d, current: 0 }));
        await saveAchievements(defaults);
        setAchievements(defaults);
      } else {
        setAchievements(a);
      }
    } catch (e) {
      console.error('Failed to load game data:', e);
    } finally {
      setIsLoading(false);
    }
  }

  const addRun = useCallback(async (runData: Omit<RunRecord, 'id' | 'createdAt' | 'xpEarned' | 'territoryGained'>) => {
    const xpEarned = calculateXpFromRun(runData.distance, runData.duration);
    const territoryGained = Math.floor(runData.distance / 100);

    const run: RunRecord = {
      ...runData,
      id: generateId(),
      xpEarned,
      territoryGained,
      createdAt: new Date().toISOString(),
    };

    const updated = [run, ...runs];
    await saveRuns(updated);
    setRuns(updated);

    if (user) {
      const today = new Date().toISOString().split('T')[0];
      const lastRun = user.lastRunDate;
      let newStreak = user.currentStreak;

      if (lastRun) {
        const lastDate = new Date(lastRun);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastRun === today) {
          // same day
        } else if (lastRun === yesterdayStr) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      const newXp = user.xp + xpEarned;
      const newLevel = calculateLevel(newXp);

      await updateUser({
        xp: newXp,
        level: newLevel,
        totalDistance: user.totalDistance + runData.distance,
        totalRuns: user.totalRuns + 1,
        currentStreak: newStreak,
        longestStreak: Math.max(user.longestStreak, newStreak),
        lastRunDate: today,
      });

      await checkAchievements({
        totalRuns: user.totalRuns + 1,
        totalDistance: user.totalDistance + runData.distance,
        currentStreak: newStreak,
        totalTerritories: territories.length,
      });
    }

    return run;
  }, [runs, user, territories, updateUser]);

  const addTerritory = useCallback(async (data: Omit<Territory, 'id' | 'capturedAt'>) => {
    const territory: Territory = {
      ...data,
      id: generateId(),
      capturedAt: new Date().toISOString(),
    };
    const updated = [...territories, territory];
    await saveTerritories(updated);
    setTerritories(updated);
  }, [territories]);

  async function checkAchievements(stats: {
    totalRuns: number;
    totalDistance: number;
    currentStreak: number;
    totalTerritories: number;
  }) {
    const updated = achievements.map(a => {
      let current = a.current;
      switch (a.category) {
        case 'runs': current = stats.totalRuns; break;
        case 'distance': current = stats.totalDistance; break;
        case 'streak': current = stats.currentStreak; break;
        case 'territory': current = stats.totalTerritories; break;
      }

      const wasUnlocked = !!a.unlockedAt;
      const isNowUnlocked = current >= a.requirement;

      return {
        ...a,
        current,
        unlockedAt: !wasUnlocked && isNowUnlocked ? new Date().toISOString() : a.unlockedAt,
      };
    });

    await saveAchievements(updated);
    setAchievements(updated);
  }

  const weeklyRuns = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return runs.filter(r => new Date(r.createdAt) >= weekAgo);
  }, [runs]);

  const todayDistance = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return runs
      .filter(r => r.createdAt.split('T')[0] === today)
      .reduce((sum, r) => sum + r.distance, 0);
  }, [runs]);

  const weeklyDistance = useMemo(() => {
    return weeklyRuns.reduce((sum, r) => sum + r.distance, 0);
  }, [weeklyRuns]);

  const value = useMemo(() => ({
    runs, territories, achievements, isLoading,
    addRun, addTerritory, weeklyRuns, todayDistance, weeklyDistance,
  }), [runs, territories, achievements, isLoading, addRun, addTerritory, weeklyRuns, todayDistance, weeklyDistance]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
