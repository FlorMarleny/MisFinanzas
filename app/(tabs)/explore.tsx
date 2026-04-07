import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import TransaccionItem from "../../components/TransaccionItem";
import { cargarTransacciones, guardarTransacciones } from "../../storage/data";

export default function TransaccionesScreen() {
  const [transacciones, setTransacciones] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("all");

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      const cargar = async () => {
        const data = await cargarTransacciones();
        if (activo) setTransacciones(Array.isArray(data) ? data : []);
      };
      cargar();
      return () => {
        activo = false;
      };
    }, []),
  );

  const eliminar = async (id: number) => {
    Alert.alert("Eliminar", "¿Eliminar este movimiento?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          const nuevas = transacciones.filter((t) => t.id !== id);
          await guardarTransacciones(nuevas);
          setTransacciones(nuevas);
        },
      },
    ]);
  };

  const filtradas = Array.isArray(transacciones)
    ? transacciones
        .filter((t) => {
          if (filtro === "income") return t.type === "income";
          if (filtro === "expense") return t.type === "expense";
          return true;
        })
        .reverse()
    : [];

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {["all", "income", "expense"].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filtro === f && styles.filterActive]}
            onPress={() => setFiltro(f)}
          >
            <Text
              style={[
                styles.filterText,
                filtro === f && styles.filterTextActive,
              ]}
            >
              {f === "all" ? "Todos" : f === "income" ? "Ingresos" : "Gastos"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filtradas}
        keyExtractor={(item) => item.id?.toString() ?? Math.random().toString()}
        renderItem={({ item }) => (
          <TransaccionItem item={item} onDelete={eliminar} />
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
        ListEmptyComponent={
          <Text style={styles.empty}>Sin movimientos aún</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  filterRow: { flexDirection: "row", gap: 8, padding: 16, paddingBottom: 8 },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 0.5,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  filterActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  filterText: { fontSize: 13, color: "#666" },
  filterTextActive: { color: "#fff", fontWeight: "500" },
  empty: { textAlign: "center", color: "#bbb", marginTop: 40, fontSize: 14 },
});
