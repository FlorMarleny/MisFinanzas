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
import { CalendarPicker } from "../../components/CalendarPicker";
import TransaccionItem from "../../components/TransaccionItem";
import { cargarTransacciones, guardarTransacciones } from "../../storage/data";
import { FilterType, Transaction } from "../../storage/types";

export default function TransaccionesScreen() {
  const [transacciones, setTransacciones] = useState<Transaction[]>([]);
  const [filtro, setFiltro] = useState("all");
  const [filter, setFilter] = useState<FilterType>(null);

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

  // Set of dates that have data (for calendar dots)
  const datesWithData = new Set(transacciones.map((t) => t.date));

  // Apply date filter first, then type filter
  const filtradas = (() => {
    let result = [...transacciones];

    // 1. Date filter
    if (filter?.type === "day") {
      result = result.filter((t) => t.date === filter.date);
    } else if (filter?.type === "month") {
      const prefix = `${filter.year}-${String(filter.month + 1).padStart(2, "0")}`;
      result = result.filter((t) => t.date.startsWith(prefix));
    }

    // 2. Type filter
    if (filtro === "income") result = result.filter((t) => t.type === "income");
    if (filtro === "expense")
      result = result.filter((t) => t.type === "expense");

    // 3. Sort by transaction date, newest first
    return result.sort((a, b) => {
      const fechaDiff = b.date.localeCompare(a.date);
      if (fechaDiff !== 0) return fechaDiff;
      return b.id - a.id; // 👈 desempata por id (Date.now()), el más reciente primero
    });
  })();

  // Summary totals for the current filtered view
  const totalIngresos = filtradas
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalGastos = filtradas
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);
  const fmt = (n: number) => "S/. " + Math.round(n).toLocaleString("es-CO");

  const emptyMessage = () => {
    if (filter && filtro !== "all") return "Sin movimientos para este filtro";
    if (filter) return "Sin movimientos en este período";
    return "Sin movimientos aún";
  };

  return (
    <View style={styles.container}>
      {/* Row 1: type filters */}
      <View style={styles.filterRow}>
        {["all", "income", "expense"].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filtro === f && styles.filterActive]}
            onPress={() => setFiltro(f)}
            activeOpacity={0.8}
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

      {/* Row 2: calendar filter */}
      <View style={styles.calendarRow}>
        <CalendarPicker
          filter={filter}
          onFilter={setFilter}
          datesWithData={datesWithData}
        />
      </View>

      {/* Summary row — only shown when there are results */}
      {filtradas.length > 0 && filtro === "all" && (
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Ingresos</Text>
            <Text style={[styles.summaryValue, { color: "#1D9E75" }]}>
              {fmt(totalIngresos)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Gastos</Text>
            <Text style={[styles.summaryValue, { color: "#D85A30" }]}>
              {fmt(totalGastos)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Balance</Text>
            <Text
              style={[
                styles.summaryValue,
                {
                  color:
                    totalIngresos - totalGastos >= 0 ? "#185FA5" : "#D85A30",
                },
              ]}
            >
              {fmt(totalIngresos - totalGastos)}
            </Text>
          </View>
        </View>
      )}

      {/* Count label */}
      {filtradas.length > 0 && (
        <Text style={styles.countLabel}>
          {filtradas.length} movimiento{filtradas.length !== 1 ? "s" : ""}
        </Text>
      )}

      {/* List */}
      <FlatList
        data={filtradas}
        keyExtractor={(item) => item.id?.toString() ?? Math.random().toString()}
        renderItem={({ item }) => (
          <TransaccionItem item={item} onDelete={eliminar} />
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
        ListEmptyComponent={<Text style={styles.empty}>{emptyMessage()}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },

  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  calendarRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    alignItems: "flex-start",
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 0.5,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  filterActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  filterText: { fontSize: 13, color: "#666" },
  filterTextActive: { color: "#fff", fontWeight: "500" },

  // Summary strip
  summaryRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 4,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 0.5,
    borderColor: "#e0e0e0",
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryLabel: {
    fontSize: 11,
    color: "#aaa",
    marginBottom: 2,
    fontWeight: "500",
  },
  summaryValue: { fontSize: 14, fontWeight: "700" },
  summaryDivider: { width: 0.5, backgroundColor: "#e0e0e0", marginVertical: 4 },

  countLabel: {
    fontSize: 11,
    color: "#bbb",
    fontWeight: "500",
    paddingHorizontal: 20,
    paddingBottom: 4,
    paddingTop: 6,
  },

  empty: { textAlign: "center", color: "#bbb", marginTop: 40, fontSize: 14 },
});
