import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import Colors from "@/constants/colors";
import { GameProvider } from "@/contexts/GameContext";

function NativeTabLayout() {
  return (
    <GameProvider>
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Icon sf={{ default: "map", selected: "map.fill" }} />
          <Label>Map</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="stats">
          <Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
          <Label>Stats</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="leaderboard">
          <Icon sf={{ default: "trophy", selected: "trophy.fill" }} />
          <Label>Ranks</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <Icon sf={{ default: "person", selected: "person.fill" }} />
          <Label>Profile</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </GameProvider>
  );
}

function ClassicTabLayout() {
  const isWeb = Platform.OS === "web";
  const isIOS = Platform.OS === "ios";

  return (
    <GameProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textTertiary,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: isIOS ? "transparent" : Colors.backgroundSecondary,
            borderTopWidth: isWeb ? 1 : 0,
            borderTopColor: Colors.border,
            elevation: 0,
            ...(isWeb ? { height: 84 } : {}),
          },
          tabBarBackground: () =>
            isIOS ? (
              <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
            ) : isWeb ? (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.backgroundSecondary }]} />
            ) : null,
          tabBarLabelStyle: {
            fontFamily: 'Outfit_500Medium',
            fontSize: 11,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Map",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="map" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: "Stats",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bar-chart" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="leaderboard"
          options={{
            title: "Ranks",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="trophy" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </GameProvider>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
