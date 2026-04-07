import { Tabs } from "expo-router";
import { Platform, Text } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#185FA5",
        tabBarInactiveTintColor: "#888",
        tabBarStyle: {
          paddingBottom: Platform.OS === "ios" ? 20 : 8,
          height: Platform.OS === "ios" ? 80 : 65,
          backgroundColor: "#fff",
          borderTopWidth: 0.5,
          borderTopColor: "#e0e0e0",
          // Sombra superior en Android
          elevation: 8,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: "#f9f9f9",
          // Sombra del header en Android
          elevation: 0,
        },
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 16,
          fontFamily: "Inter_600SemiBold", // ✅
        },
        // ✅ CLAVE: centra el título en Android
        headerTitleAlign: "center",
        // ✅ Quita el headerStatusBarHeight manual,
        //    deja que expo-router lo maneje solo
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

// import { Tabs } from "expo-router";
// import { Platform, Text } from "react-native";

// export default function TabLayout() {
//   return (
//     <Tabs
//       screenOptions={{
//         tabBarActiveTintColor: "#185FA5",
//         tabBarInactiveTintColor: "#888",
//         tabBarStyle: {
//           paddingBottom: Platform.OS === "ios" ? 20 : 8,
//           height: Platform.OS === "ios" ? 80 : 65,
//           backgroundColor: "#fff",
//           borderTopWidth: 0.5,
//           borderTopColor: "#e0e0e0",
//            // Sombra superior en Android
//           elevation: 8,
//         },
//         headerShown: true,
//         headerStyle: { backgroundColor: "#f9f9f9" ,
//           // Sombra del header en Android
//         elevation: 0,

//         },

//         headerTitleStyle: {
//           fontWeight: "600",
//           fontSize: 16
//         },
//         headerTitleAlign: "center",
//       }}
//     >
//       <Tabs.Screen
//         name="index"
//         options={{
//           title: "Resumen",
//           tabBarIcon: () => <Text style={{ fontSize: 20 }}>📊</Text>,
//         }}
//       />
//       <Tabs.Screen
//         name="explore"
//         options={{
//           title: "Movimientos",
//           tabBarIcon: () => <Text style={{ fontSize: 20 }}>📋</Text>,
//         }}
//       />
//       <Tabs.Screen
//         name="agregar"
//         options={{
//           title: "Agregar",
//           tabBarIcon: () => <Text style={{ fontSize: 20 }}>➕</Text>,
//         }}
//       />
//       <Tabs.Screen
//         name="metas"
//         options={{
//           title: "Metas",
//           tabBarIcon: () => <Text style={{ fontSize: 20 }}>🎯</Text>,
//         }}
//       />
//     </Tabs>
//   );
// }
