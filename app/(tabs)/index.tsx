import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CalendarPicker } from "../../components/CalendarPicker";
import { OnboardingNombre } from "../../components/OnboardingNombre";
import { useUsuario } from "../../hooks/useUsuario";
import { cargarMetas, cargarTransacciones } from "../../storage/data";
import { FilterType, Transaction } from "../../storage/types";

const ICONS: Record<string, string> = {
  Comida: "🍽",
  Transporte: "🚌",
  Salud: "💊",
  Entretenimiento: "🎬",
  Vivienda: "🏠",
  Educación: "📚",
  Ropa: "👕",
  Servicios: "⚡",
  Otro: "📦",
};

const MONTHS_SHORT = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${parseInt(d)} ${MONTHS_SHORT[parseInt(m) - 1]} ${y}`;
}

function getSaludo(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Buenos días";
  if (h >= 12 && h < 19) return "Buenas tardes";
  return "Buenas noches";
}

function primerNombre(nombre: string): string {
  return nombre.split(" ")[0];
}

export default function DashboardScreen() {
  const { nombre, cargando, guardarNombre } = useUsuario();
  const router = useRouter();
  const [transacciones, setTransacciones] = useState<Transaction[]>([]);
  const [metas, setMetas] = useState<any[]>([]);
  // Default: current month — so dashboard always shows relevant data
  const hoy = new Date();
  const [filter, setFilter] = useState<FilterType>({
    type: "month",
    year: hoy.getFullYear(),
    month: hoy.getMonth(),
  });

  useFocusEffect(
    useCallback(() => {
      const cargar = async () => {
        setTransacciones(await cargarTransacciones());
        setMetas(await cargarMetas());
      };
      cargar();
    }, []),
  );

  // Loading splash
  if (cargando) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#185FA5" />
      </View>
    );
  }

  // Onboarding — shown only the first time
  if (!nombre) {
    return <OnboardingNombre onGuardar={guardarNombre} />;
  }

  // Filtered transactions
  const transaccionesFiltradas = (() => {
    if (!filter) return transacciones;
    if (filter.type === "day")
      return transacciones.filter((t) => t.date === filter.date);
    if (filter.type === "month") {
      const prefix = `${filter.year}-${String(filter.month + 1).padStart(2, "0")}`;
      return transacciones.filter((t) => t.date.startsWith(prefix));
    }
    return transacciones;
  })();

  const ingresos = transaccionesFiltradas
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);

  const gastos = transaccionesFiltradas
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);

  const balance = ingresos - gastos;
  const fmt = (n: number) => "S/. " + Math.round(n).toLocaleString("es-CO");

  const porCategoria: Record<string, number> = {};
  transaccionesFiltradas
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      porCategoria[t.category] =
        (porCategoria[t.category] || 0) + Number(t.amount);
    });

  const datesWithData = new Set(transacciones.map((t) => t.date));
  // Top 5 most recent of the filtered period (preview — full list lives in Movimientos tab)
  const recientes = [...transaccionesFiltradas]
    .sort((a, b) => {
      const fechaDiff = b.date.localeCompare(a.date);
      if (fechaDiff !== 0) return fechaDiff;
      return b.id - a.id; // 👈 más reciente primero si misma fecha
    })
    .slice(0, 5);

  const MONTHS_FULL = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const periodLabel = (() => {
    if (!filter) return "Últimos movimientos";
    if (filter.type === "day")
      return `Movimientos del ${formatDate(filter.date)}`;
    if (filter.type === "month") {
      const esEsteMes =
        filter.year === hoy.getFullYear() && filter.month === hoy.getMonth();
      return esEsteMes
        ? "Movimientos de este mes"
        : `Movimientos de ${MONTHS_FULL[filter.month]} ${filter.year}`;
    }
    return "Últimos movimientos";
  })();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Greeting + calendar filter */}
      <View style={styles.topBar}>
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingLabel}>{getSaludo()},</Text>
          <Text style={styles.greetingName}>{primerNombre(nombre)} 👋</Text>
        </View>
        <CalendarPicker
          filter={filter}
          onFilter={setFilter}
          datesWithData={datesWithData}
        />
      </View>

      {/* Metrics */}
      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { flex: 1 }]}>
          <Text style={styles.metricLabel}>Ingresos</Text>
          <Text style={[styles.metricValue, { color: "#1D9E75" }]}>
            {fmt(ingresos)}
          </Text>
        </View>
        <View style={[styles.metricCard, { flex: 1 }]}>
          <Text style={styles.metricLabel}>Gastos</Text>
          <Text style={[styles.metricValue, { color: "#D85A30" }]}>
            {fmt(gastos)}
          </Text>
        </View>
      </View>

      <View
        style={[styles.metricCard, { marginHorizontal: 16, marginBottom: 16 }]}
      >
        <Text style={styles.metricLabel}>Balance</Text>
        <Text
          style={[
            styles.metricValue,
            { color: balance >= 0 ? "#185FA5" : "#D85A30" },
          ]}
        >
          {fmt(balance)}
        </Text>
      </View>

      {/* Category breakdown */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Gastos por categoría</Text>
        {Object.keys(porCategoria).length === 0 ? (
          <Text style={styles.empty}>Sin gastos registrados este mes</Text>
        ) : (
          Object.entries(porCategoria)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, val]) => {
              const pct = gastos > 0 ? (val / gastos) * 100 : 0;
              return (
                <View key={cat} style={{ marginBottom: 10 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={styles.catLabel}>
                      {ICONS[cat] || "📦"} {cat}
                    </Text>
                    <Text style={styles.catVal}>
                      {fmt(val)} ({Math.round(pct)}%)
                    </Text>
                  </View>
                  <View style={styles.progressBg}>
                    <View
                      style={[styles.progressFill, { width: `${pct}%` as any }]}
                    />
                  </View>
                </View>
              );
            })
        )}
      </View>

      {/* Recent / filtered movements */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{periodLabel}</Text>
        {recientes.length === 0 ? (
          <Text style={styles.empty}>Sin movimientos este mes</Text>
        ) : (
          recientes.map((t, i) => (
            <View key={i} style={styles.txnRow}>
              <Text style={{ fontSize: 22 }}>{ICONS[t.category] || "📦"}</Text>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.txnDesc}>{t.desc || t.category}</Text>
                <Text style={styles.txnMeta}>
                  {t.category} · {formatDate(t.date)}
                </Text>
              </View>
              <Text
                style={{
                  color: t.type === "income" ? "#1D9E75" : "#D85A30",
                  fontWeight: "600",
                }}
              >
                {t.type === "income" ? "+" : "−"}
                {fmt(t.amount)}
              </Text>
            </View>
          ))
        )}

        {/* Ver todos button */}
        <TouchableOpacity
          style={styles.verTodosBtn}
          onPress={() => router.push("/(tabs)/explore")}
          activeOpacity={0.7}
        >
          <Text style={styles.verTodosText}>Ver todos los movimientos →</Text>
        </TouchableOpacity>
      </View>

      {/* Goals — not filtered by date */}
      {metas.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Metas de ahorro</Text>
          {[...metas]
            .filter((g) => g.date) // las que tienen fecha límite primero
            .sort((a, b) => a.date.localeCompare(b.date)) // más próxima a vencer primero
            .concat(metas.filter((g) => !g.date)) // las sin fecha al final
            .slice(0, 5)
            .map((g, i) => {
              const pct = Math.min(
                100,
                Math.round((g.current / g.target) * 100),
              );
              const color =
                pct >= 80 ? "#1D9E75" : pct >= 40 ? "#185FA5" : "#D85A30";
              return (
                <View key={i} style={{ marginBottom: 12 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={styles.catLabel}>{g.name}</Text>
                    <Text style={[styles.catVal, { color, fontWeight: "600" }]}>
                      {pct}%
                    </Text>
                  </View>
                  <View style={styles.progressBg}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${pct}%` as any, backgroundColor: color },
                      ]}
                    />
                  </View>
                  <Text style={styles.txnMeta}>
                    {fmt(g.current)} / {fmt(g.target)}
                  </Text>
                </View>
              );
            })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  splash: { flex: 1, justifyContent: "center", alignItems: "center" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
  },
  greetingBlock: { flexShrink: 1, marginRight: 10 },
  greetingLabel: { fontSize: 13, color: "#888", marginBottom: 1 },
  greetingName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: -0.4,
  },

  metricsRow: { flexDirection: "row", gap: 12, margin: 16, marginBottom: 8 },
  metricCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: Platform.OS === "ios" ? 0.5 : 0,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  metricLabel: { fontSize: 12, color: "#888", marginBottom: 4 },
  metricValue: { fontSize: 20, fontWeight: "600" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: "#e0e0e0",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  empty: {
    color: "#bbb",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 12,
  },
  catLabel: { fontSize: 13, color: "#333" },
  catVal: { fontSize: 13, color: "#888" },
  progressBg: {
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 99,
    marginTop: 4,
    overflow: "hidden",
  },
  progressFill: { height: 8, borderRadius: 99, backgroundColor: "#D85A30" },
  txnRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: "#f0f0f0",
  },
  txnDesc: { fontSize: 14, fontWeight: "500", color: "#1a1a1a" },
  txnMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  verTodosBtn: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderColor: "#f0f0f0",
    alignItems: "center",
  },
  verTodosText: { fontSize: 13, color: "#185FA5", fontWeight: "600" },
});
