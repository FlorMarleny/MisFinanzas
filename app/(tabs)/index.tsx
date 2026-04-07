import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { cargarMetas, cargarTransacciones } from "../../storage/data";

export default function DashboardScreen() {
  const [transacciones, setTransacciones] = useState<any[]>([]);
  const [metas, setMetas] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      const cargar = async () => {
        setTransacciones(await cargarTransacciones());
        setMetas(await cargarMetas());
      };
      cargar();
    }, []),
  );

  const ingresos = transacciones
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const gastos = transacciones
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);
  const balance = ingresos - gastos;
  const fmt = (n: number) => "S/. " + Math.round(n).toLocaleString("es-CO");

  const porCategoria: Record<string, number> = {};
  transacciones
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      porCategoria[t.category] =
        (porCategoria[t.category] || 0) + Number(t.amount);
    });

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

  const recientes = [...transacciones].reverse().slice(0, 5);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
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

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Gastos por categoría</Text>
        {Object.keys(porCategoria).length === 0 ? (
          <Text style={styles.empty}>Sin gastos registrados aún</Text>
        ) : (
          Object.entries(porCategoria).map(([cat, val]) => {
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

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Últimos movimientos</Text>
        {recientes.length === 0 ? (
          <Text style={styles.empty}>Sin movimientos aún</Text>
        ) : (
          recientes.map((t, i) => (
            <View key={i} style={styles.txnRow}>
              <Text style={{ fontSize: 22 }}>{ICONS[t.category] || "📦"}</Text>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.txnDesc}>{t.desc || t.category}</Text>
                <Text style={styles.txnMeta}>
                  {t.category} · {t.date}
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
      </View>

      {metas.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Metas de ahorro</Text>
          {metas.map((g, i) => {
            const pct = Math.min(100, Math.round((g.current / g.target) * 100));
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
  metricsRow: { flexDirection: "row", gap: 12, margin: 16, marginBottom: 8 },
  metricCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: Platform.OS === "ios" ? 0.5 : 0, // ✅ en Android borderWidth se ve raro
    borderColor: "#e0e0e0",
    // ✅ Sombras cross-platform
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  metricLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
    fontFamily: "Inter_400Regular", // ✅
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold", // ✅
  },
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
    fontFamily: "Inter_600SemiBold", // ✅
  },
  empty: {
    color: "#bbb",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 12,
  },
  catLabel: {
    fontSize: 13,
    color: "#333",
    fontFamily: "Inter_400Regular", // ✅
  },
  catVal: {
    fontSize: 13,
    color: "#888",
    fontFamily: "Inter_400Regular", // ✅
  },
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
  txnDesc: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1a1a1a",
    fontFamily: "Inter_500Medium", // ✅
  },
  txnMeta: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
    fontFamily: "Inter_400Regular", // ✅
  },
});
