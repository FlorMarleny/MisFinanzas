import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { cargarMetas, guardarMetas } from "../../storage/data";

export default function MetasScreen() {
  const [metas, setMetas] = useState<any[]>([]);
  const [nombre, setNombre] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [fecha, setFecha] = useState<Date | null>(null);
  const [mostrarCal, setMostrarCal] = useState(false);
  const [abonoId, setAbonoId] = useState<number | null>(null);
  const [montoAbono, setMontoAbono] = useState("");

  useFocusEffect(
    useCallback(() => {
      const cargar = async () => setMetas(await cargarMetas());
      cargar();
    }, []),
  );

  const fmtFecha = (d: Date) => d.toISOString().split("T")[0];
  const fmtFechaLegible = (d: Date) =>
    d.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const agregar = async () => {
    if (!nombre || !objetivo || isNaN(Number(objetivo))) {
      Alert.alert("Error", "Completa el nombre y monto objetivo");
      return;
    }
    const nuevas = [
      ...metas,
      {
        id: Date.now(),
        name: nombre,
        target: Number(objetivo),
        current: 0,
        date: fecha ? fmtFecha(fecha) : null,
        abonos: [],
      },
    ];
    await guardarMetas(nuevas);
    setMetas(nuevas);
    setNombre("");
    setObjetivo("");
    setFecha(null);
  };

  const abonar = async (id: number) => {
    const monto = Number(montoAbono);
    if (!monto || isNaN(monto) || monto <= 0) {
      Alert.alert("Error", "Ingresa un monto válido");
      return;
    }
    const nuevas = metas.map((m) => {
      if (m.id !== id) return m;
      const abonos = [
        ...(m.abonos || []),
        { monto, fecha: new Date().toISOString().split("T")[0] },
      ];
      return { ...m, current: m.current + monto, abonos };
    });
    await guardarMetas(nuevas);
    setMetas(nuevas);
    setMontoAbono("");
    setAbonoId(null);
    Alert.alert(
      "✅ Abono registrado",
      `Se agregaron $${monto.toLocaleString("es-CO")} a tu meta`,
    );
  };

  const eliminar = async (id: number) => {
    Alert.alert("Eliminar", "¿Eliminar esta meta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          const nuevas = metas.filter((m) => m.id !== id);
          await guardarMetas(nuevas);
          setMetas(nuevas);
        },
      },
    ]);
  };

  const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-CO");

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Nueva meta</Text>

        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Ej: Vacaciones, Fondo de emergencia..."
        />

        <Text style={styles.label}>Monto objetivo ($)</Text>
        <TextInput
          style={styles.input}
          value={objetivo}
          onChangeText={setObjetivo}
          keyboardType="numeric"
          placeholder="5000000"
        />

        <Text style={styles.label}>Fecha límite (opcional)</Text>
        <TouchableOpacity
          style={styles.dateBtn}
          onPress={() => setMostrarCal(true)}
        >
          <Text style={{ fontSize: 16, marginRight: 8 }}>📅</Text>
          <Text style={{ fontSize: 14, color: fecha ? "#1a1a1a" : "#aaa" }}>
            {fecha ? fmtFechaLegible(fecha) : "Seleccionar fecha"}
          </Text>
        </TouchableOpacity>

        {mostrarCal && (
          <DateTimePicker
            value={fecha || new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={new Date()}
            onChange={(event, selected) => {
              setMostrarCal(Platform.OS === "ios");
              if (selected) setFecha(selected);
              if (Platform.OS === "android") setMostrarCal(false);
            }}
          />
        )}

        {fecha && (
          <TouchableOpacity
            onPress={() => setFecha(null)}
            style={{ marginBottom: 12 }}
          >
            <Text style={{ fontSize: 12, color: "#D85A30" }}>
              ✕ Quitar fecha
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.btn} onPress={agregar}>
          <Text style={styles.btnText}>Crear meta</Text>
        </TouchableOpacity>
      </View>

      {metas.length === 0 && (
        <Text style={styles.empty}>Sin metas creadas aún</Text>
      )}

      {metas.map((g) => {
        const pct = Math.min(100, Math.round((g.current / g.target) * 100));
        const color = pct >= 80 ? "#1D9E75" : pct >= 40 ? "#185FA5" : "#D85A30";
        const falta = g.target - g.current;
        const abierto = abonoId === g.id;

        return (
          <View key={g.id} style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalName}>{g.name}</Text>
              <TouchableOpacity onPress={() => eliminar(g.id)}>
                <Text style={{ fontSize: 20, color: "#ccc" }}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${pct}%` as any, backgroundColor: color },
                ]}
              />
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 6,
              }}
            >
              <Text style={styles.goalMeta}>{fmt(g.current)} ahorrado</Text>
              <Text style={[styles.goalMeta, { color, fontWeight: "600" }]}>
                {pct}%
              </Text>
            </View>
            <Text style={styles.goalMeta}>
              Objetivo: {fmt(g.target)} · Faltan: {fmt(falta > 0 ? falta : 0)}
            </Text>
            {g.date ? (
              <Text style={styles.goalMeta}>📅 Fecha límite: {g.date}</Text>
            ) : null}

            {pct >= 100 && (
              <View style={styles.completado}>
                <Text
                  style={{ color: "#1D9E75", fontWeight: "600", fontSize: 13 }}
                >
                  🎉 ¡Meta cumplida!
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.abonarBtn,
                { backgroundColor: abierto ? "#f0f0f0" : "#1D9E75" },
              ]}
              onPress={() => {
                setAbonoId(abierto ? null : g.id);
                setMontoAbono("");
              }}
            >
              <Text
                style={{
                  color: abierto ? "#888" : "#fff",
                  fontWeight: "600",
                  fontSize: 13,
                }}
              >
                {abierto ? "Cancelar" : "+ Abonar"}
              </Text>
            </TouchableOpacity>

            {abierto && (
              <View style={styles.abonoRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  value={montoAbono}
                  onChangeText={setMontoAbono}
                  keyboardType="numeric"
                  placeholder="Monto a abonar"
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.abonoConfirm}
                  onPress={() => abonar(g.id)}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    Guardar
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {g.abonos?.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={[styles.label, { marginBottom: 4 }]}>
                  Historial de abonos
                </Text>
                {[...g.abonos]
                  .reverse()
                  .slice(0, 3)
                  .map((a: any, i: number) => (
                    <View key={i} style={styles.abonoItem}>
                      <Text style={styles.goalMeta}>{a.fecha}</Text>
                      <Text
                        style={{
                          fontSize: 13,
                          color: "#1D9E75",
                          fontWeight: "500",
                        }}
                      >
                        +{fmt(a.monto)}
                      </Text>
                    </View>
                  ))}
                {g.abonos.length > 3 && (
                  <Text
                    style={[
                      styles.goalMeta,
                      { textAlign: "center", marginTop: 4 },
                    ]}
                  >
                    +{g.abonos.length - 3} abonos más
                  </Text>
                )}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "#e0e0e0",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  label: { fontSize: 12, color: "#888", marginBottom: 6, fontWeight: "500" },
  input: {
    borderWidth: 0.5,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginBottom: 14,
    color: "#1a1a1a",
    backgroundColor: "#fafafa",
  },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    backgroundColor: "#fafafa",
  },
  btn: {
    backgroundColor: "#185FA5",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  goalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "#e0e0e0",
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  goalName: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  progressBg: {
    height: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 99,
    overflow: "hidden",
  },
  progressFill: { height: 10, borderRadius: 99 },
  goalMeta: { fontSize: 12, color: "#888", marginTop: 3 },
  completado: {
    backgroundColor: "#E1F5EE",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    marginTop: 8,
  },
  abonarBtn: {
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    marginTop: 12,
  },
  abonoRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    alignItems: "center",
  },
  abonoConfirm: {
    backgroundColor: "#1D9E75",
    borderRadius: 8,
    padding: 10,
    paddingHorizontal: 16,
  },
  abonoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderColor: "#f0f0f0",
  },
  empty: { textAlign: "center", color: "#bbb", marginTop: 40, fontSize: 14 },
});
