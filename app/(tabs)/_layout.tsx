import { Tabs } from "expo-router";
import { Platform, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#185FA5",
        tabBarInactiveTintColor: "#888",
        tabBarStyle: {
          height: Platform.OS === "ios" ? 80 : 60 + insets.bottom,
          paddingBottom: Platform.OS === "ios" ? 20 : insets.bottom + 4,
          paddingTop: 6,
          backgroundColor: "#fff",
          borderTopWidth: 0.5,
          borderTopColor: "#e0e0e0",
          elevation: 8,
        },
        headerShown: true,
        headerStyle: { backgroundColor: "#f9f9f9", elevation: 0 },
        headerTitleStyle: { fontWeight: "600", fontSize: 17 },
        headerTitleAlign: "center",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Resumen",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>📊</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Movimientos",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>📋</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="agregar"
        options={{
          title: "Agregar",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>➕</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="metas"
        options={{
          title: "Metas",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>🎯</Text>
          ),
        }}
      />
    </Tabs>
  );
}
