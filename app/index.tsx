import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

export default function IndexScreen() {
  const { isLoading, isAuthenticated, isProfileComplete } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    } else if (!isProfileComplete) {
      router.replace('/(auth)/setup');
    } else {
      router.replace('/(tabs)');
    }
  }, [isLoading, isAuthenticated, isProfileComplete]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
