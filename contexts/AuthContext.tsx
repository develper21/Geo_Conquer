import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { getUser, saveUser, clearAllData, UserProfile, generateId, AVATAR_COLORS } from '@/lib/storage';

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  login: (email: string) => Promise<void>;
  completeProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const stored = await getUser();
      setUser(stored);
    } catch (e) {
      console.error('Failed to load user:', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string) {
    const newUser: UserProfile = {
      id: generateId(),
      username: '',
      email,
      avatar: '',
      bio: '',
      goal: '',
      country: '',
      state: '',
      xp: 0,
      level: 1,
      totalDistance: 0,
      totalRuns: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastRunDate: null,
      territoryColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      createdAt: new Date().toISOString(),
    };
    await saveUser(newUser);
    setUser(newUser);
  }

  async function completeProfile(data: Partial<UserProfile>) {
    if (!user) return;
    const updated = { ...user, ...data };
    await saveUser(updated);
    setUser(updated);
  }

  async function updateUser(updates: Partial<UserProfile>) {
    if (!user) return;
    const updated = { ...user, ...updates };
    await saveUser(updated);
    setUser(updated);
  }

  async function logout() {
    await clearAllData();
    setUser(null);
  }

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    isProfileComplete: !!user && !!user.username && !!user.goal,
    login,
    completeProfile,
    updateUser,
    logout,
  }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
