import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, FadeIn, FadeInDown } from 'react-native-reanimated';
import MapView, { Marker, Circle, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { formatDistance, formatDuration, formatPace, generateId } from '@/lib/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Coordinate {
  latitude: number;
  longitude: number;
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { addRun, addTerritory, territories, todayDistance } = useGame();

  const [permission, requestPermission] = Location.useForegroundPermissions();
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [runPath, setRunPath] = useState<Coordinate[]>([]);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastLocationRef = useRef<Coordinate | null>(null);

  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1000 }),
        withTiming(1, { duration: 1000 }),
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  useEffect(() => {
    getInitialLocation();
    return () => {
      locationSubRef.current?.remove();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function getInitialLocation() {
    try {
      if (!permission?.granted) {
        const result = await requestPermission();
        if (!result.granted) return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (e) {
      console.error('Location error:', e);
    }
  }

  function calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
    const R = 6371000;
    const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((coord1.latitude * Math.PI) / 180) *
      Math.cos((coord2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async function startRun() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsRunning(true);
    setIsPaused(false);
    setRunPath([]);
    setDistance(0);
    setDuration(0);
    setCurrentSpeed(0);
    setStartTime(new Date());
    lastLocationRef.current = null;

    timerRef.current = setInterval(() => {
      setDuration(d => d + 1);
    }, 1000);

    try {
      locationSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000,
          distanceInterval: 5,
        },
        (loc) => {
          const coord: Coordinate = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };

          const speed = loc.coords.speed ?? 0;
          const maxReasonableSpeed = 12;
          if (speed > maxReasonableSpeed) return;

          setCurrentLocation(coord);
          setCurrentSpeed(speed > 0 ? speed : 0);

          if (lastLocationRef.current) {
            const d = calculateDistance(lastLocationRef.current, coord);
            if (d > 2 && d < 200) {
              setDistance(prev => prev + d);
              setRunPath(prev => [...prev, coord]);
            }
          } else {
            setRunPath([coord]);
          }
          lastLocationRef.current = coord;
        }
      );
    } catch (e) {
      console.error('Watch position error:', e);
    }
  }

  function pauseRun() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPaused(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    locationSubRef.current?.remove();
    locationSubRef.current = null;
  }

  async function resumeRun() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPaused(false);

    timerRef.current = setInterval(() => {
      setDuration(d => d + 1);
    }, 1000);

    locationSubRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,
        distanceInterval: 5,
      },
      (loc) => {
        const coord: Coordinate = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };

        const speed = loc.coords.speed ?? 0;
        if (speed > 12) return;

        setCurrentLocation(coord);
        setCurrentSpeed(speed > 0 ? speed : 0);

        if (lastLocationRef.current) {
          const d = calculateDistance(lastLocationRef.current, coord);
          if (d > 2 && d < 200) {
            setDistance(prev => prev + d);
            setRunPath(prev => [...prev, coord]);
          }
        }
        lastLocationRef.current = coord;
      }
    );
  }

  async function stopRun() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsRunning(false);
    setIsPaused(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    locationSubRef.current?.remove();
    locationSubRef.current = null;

    if (distance > 10 && duration > 10) {
      const avgPace = distance > 0 ? distance / duration : 0;

      await addRun({
        startTime: startTime?.toISOString() || new Date().toISOString(),
        endTime: new Date().toISOString(),
        duration,
        distance,
        avgPace,
        maxSpeed: currentSpeed,
        path: runPath,
      });

      if (runPath.length > 0 && user) {
        const center = runPath[Math.floor(runPath.length / 2)];
        await addTerritory({
          userId: user.id,
          center,
          radius: Math.min(distance / 10, 500),
          color: user.territoryColor,
          distance,
        });
      }
    }

    setRunPath([]);
    setDistance(0);
    setDuration(0);
    setCurrentSpeed(0);
  }

  if (!permission) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
        <View style={styles.permissionCard}>
          <View style={styles.permissionIcon}>
            <Ionicons name="location" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.permissionTitle}>Location Access Required</Text>
          <Text style={styles.permissionDesc}>
            RunConquer needs your location to track runs and claim territory on the map.
          </Text>
          <Pressable style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Enable Location</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: currentLocation?.latitude || 37.78825,
          longitude: currentLocation?.longitude || -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        followsUserLocation={isRunning}
        userLocationPriority="high"
      >
        {/* Territories */}
        {territories.map((t) => (
          <Circle
            key={t.id}
            center={{
              latitude: t.center.latitude,
              longitude: t.center.longitude,
            }}
            radius={t.radius}
            fillColor={t.color + '40'}
            strokeColor={t.color}
            strokeWidth={2}
          />
        ))}

        {/* Current run path */}
        {isRunning && runPath.length > 1 && (
          <Polyline
            coordinates={runPath}
            strokeColor={user?.territoryColor || Colors.primary}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Current location marker */}
        {currentLocation && !isRunning && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Your Location"
          >
            <View style={[styles.locationMarker, { backgroundColor: Colors.primary }]}>
              <View style={styles.locationMarkerInner} />
            </View>
          </Marker>
        )}
      </MapView>

      <View style={[styles.topOverlay, { paddingTop: Platform.OS === 'web' ? 67 : insets.top + 8 }]}>
        <View style={styles.statusBar}>
          <View style={styles.statusItem}>
            <Ionicons name="footsteps" size={16} color={Colors.primary} />
            <Text style={styles.statusText}>{formatDistance(todayDistance)} today</Text>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.liveDot, isRunning && !isPaused && styles.liveDotActive]} />
            <Text style={styles.statusText}>
              {isRunning ? (isPaused ? 'PAUSED' : 'LIVE') : 'READY'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons name="flag" size={16} color={Colors.primary} />
            <Text style={styles.statusText}>{territories.length} zones</Text>
          </View>
        </View>
      </View>

      <View style={[styles.bottomPanel, { paddingBottom: Platform.OS === 'web' ? 34 + 60 : insets.bottom + 90 }]}>
        {isRunning && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatDistance(distance)}</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatDuration(duration)}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {currentSpeed > 0 ? formatPace(currentSpeed) : '--:--'}
              </Text>
              <Text style={styles.statLabel}>Pace</Text>
            </View>
          </Animated.View>
        )}

        <View style={styles.controlRow}>
          {isRunning ? (
            <>
              <Pressable
                style={[styles.controlBtn, styles.stopBtn]}
                onPress={stopRun}
              >
                <Ionicons name="stop" size={24} color="#fff" />
              </Pressable>
              <Pressable
                style={[styles.controlBtn, styles.pauseBtn]}
                onPress={isPaused ? resumeRun : pauseRun}
              >
                <Ionicons name={isPaused ? 'play' : 'pause'} size={28} color="#fff" />
              </Pressable>
            </>
          ) : (
            <Pressable style={styles.startBtn} onPress={startRun}>
              <LinearGradient
                colors={[Colors.primary, Colors.accent]}
                style={styles.startBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="play" size={32} color="#fff" />
                <Text style={styles.startBtnText}>Start Run</Text>
              </LinearGradient>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  locationMarker: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  locationMarkerInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 13, 13, 0.85)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textTertiary,
  },
  liveDotActive: {
    backgroundColor: Colors.success,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(13, 13, 13, 0.9)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: Colors.text,
  },
  statLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  startBtn: {
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  startBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 18,
    gap: 10,
  },
  startBtnText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 18,
    color: '#fff',
  },
  controlBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopBtn: {
    backgroundColor: Colors.danger,
  },
  pauseBtn: {
    backgroundColor: Colors.primary,
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  permissionCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 24,
  },
  permissionIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  permissionTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionDesc: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  permissionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  permissionBtnText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
});
