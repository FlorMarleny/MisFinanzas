import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  cancelarNotificacionesMeta,
  programarNotificacionesMeta,
} from "../../hooks/useNotificaciones";
import { cargarMetas, guardarMetas } from "../../storage/data";

const { width } = Dimensions.get("window");

export default function MetasScreen() {
  const [metas, setMetas] = useState<any[]>([]);
  const [nombre, setNombre] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [fecha, setFecha] = useState<Date | null>(null);
  const [mostrarCal, setMostrarCal] = useState(false);
  const [abonoId, setAbonoId] = useState<number | null>(null);
  const [montoAbono, setMontoAbono] = useState("");
  const [tabIndex, setTabIndex] = useState(0);
  const [verTodasVencidas, setVerTodasVencidas] = useState(false);

  const routes = [
    { key: "activas", title: "Activas" },
    { key: "cumplidas", title: "Cumplidas" },
    { key: "vencidas", title: "Vencidas" },
  ];

  useFocusEffect(
    useCallback(() => {
      const cargar = async () => setMetas(await cargarMetas());
      cargar();
    }, []),
  );

  const fmtFecha = (d: Date) => d.toISOString().split("T")[0];
  const fmtFechaLegible = (d: Date) =>
    d.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  const fmt = (n: number) => "S/. " + Math.round(n).toLocaleString("es-PE");

  const estaVencida = (g: any) => {
    if (!g.date) return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const limite = new Date(g.date + "T00:00:00");
    return limite < hoy;
  };

  const cumplioMeta = (g: any) => g.current >= g.target;

  const agregar = async () => {
    if (!nombre || !objetivo || isNaN(Number(objetivo))) {
      Alert.alert("Error", "Completa el nombre y monto objetivo");
      return;
    }
    const id = Date.now();
    const nuevas = [
      {
        id,
        name: nombre,
        target: Number(objetivo),
        current: 0,
        date: fecha ? fmtFecha(fecha) : null,
        abonos: [],
        creadaEn: new Date().toISOString(),
      },
      ...metas,
    ];
    await guardarMetas(nuevas);
    setMetas(nuevas);
    if (fecha) await programarNotificacionesMeta(id, nombre, fmtFecha(fecha));
    setNombre("");
    setObjetivo("");
    setFecha(null);
    Alert.alert(
      "✅ Meta creada",
      fecha ? "Se programaron notificaciones" : "Meta creada correctamente",
    );
  };

  const abonar = async (id: number) => {
    const monto = Number(montoAbono);
    if (!monto || isNaN(monto) || monto <= 0) {
      Alert.alert("Error", "Ingresa un monto válido");
      return;
    }
    const meta = metas.find((m) => m.id === id)!;
    const falta = meta.target - meta.current;
    const montoReal = Math.min(monto, falta);
    const nuevas = metas.map((m) => {
      if (m.id !== id) return m;
      const abonos = [
        ...(m.abonos || []),
        { monto: montoReal, fecha: new Date().toISOString().split("T")[0] },
      ];
      return { ...m, current: m.current + montoReal, abonos };
    });
    await guardarMetas(nuevas);
    setMetas(nuevas);
    const cumplida = meta.current + montoReal >= meta.target;
    setMontoAbono("");
    setAbonoId(null);
    Alert.alert(
      cumplida ? "🎉 ¡Meta cumplida!" : "✅ Abono registrado",
      cumplida
        ? `Completaste tu meta con ${fmt(montoReal)}!`
        : `Se agregaron ${fmt(montoReal)} a tu meta`,
    );
  };

  const eliminar = async (id: number) => {
    Alert.alert("Eliminar", "¿Eliminar esta meta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await cancelarNotificacionesMeta(id);
          const nuevas = metas.filter((m) => m.id !== id);
          await guardarMetas(nuevas);
          setMetas(nuevas);
        },
      },
    ]);
  };

  const metasActivas = [...metas]
    .filter((g) => !estaVencida(g) && !cumplioMeta(g))
    .sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date > b.date ? 1 : -1;
    });

  const metasCumplidas = [...metas]
    .filter((g) => cumplioMeta(g))
    .sort((a, b) => ((b.creadaEn || 0) > (a.creadaEn || 0) ? 1 : -1));

  const metasVencidas = [...metas]
    .filter((g) => estaVencida(g) && !cumplioMeta(g))
    .sort((a, b) => (b.date > a.date ? 1 : -1));

  const vencidasMostradas = verTodasVencidas
    ? metasVencidas
    : metasVencidas.slice(0, 5);

  const renderMeta = (g: any, ocultarAbonar = false) => {
    const pct = Math.min(100, Math.round((g.current / g.target) * 100));
    const vencida = estaVencida(g);
    const cumplida = cumplioMeta(g);
    const color = vencida
      ? "#888"
      : cumplida
        ? "#1D9E75"
        : pct >= 80
          ? "#1D9E75"
          : pct >= 40
            ? "#185FA5"
            : "#D85A30";
    const falta = g.target - g.current;
    const abierto = abonoId === g.id;

    return (
      <View
        key={g.id}
        style={[styles.goalCard, vencida && styles.goalCardVencida]}
      >
        {vencida && (
          <View style={[styles.badge, { backgroundColor: "#FCEBEB" }]}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#D85A30" }}>
              ❌ No se cumplió la meta
            </Text>
          </View>
        )}
        {cumplida && (
          <View style={[styles.badge, { backgroundColor: "#E1F5EE" }]}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#1D9E75" }}>
              🎉 ¡Meta cumplida!
            </Text>
          </View>
        )}

        <View style={styles.goalHeader}>
          <Text style={[styles.goalName, vencida && { color: "#888" }]}>
            {g.name}
          </Text>
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
        {g.date && (
          <Text style={[styles.goalMeta, vencida && { color: "#D85A30" }]}>
            {vencida ? "⚠️ Venció: " : "📅 Fecha límite: "}
            {g.date}
          </Text>
        )}

        {!ocultarAbonar && !vencida && !cumplida && (
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
        )}

        {abierto && !vencida && !cumplida && (
          <View style={styles.abonoRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={montoAbono}
              onChangeText={setMontoAbono}
              keyboardType="numeric"
              placeholder={`Máx: ${fmt(g.target - g.current)}`}
              autoFocus
            />
            <TouchableOpacity
              style={styles.abonoConfirm}
              onPress={() => abonar(g.id)}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>Guardar</Text>
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
                style={[styles.goalMeta, { textAlign: "center", marginTop: 4 }]}
              >
                +{g.abonos.length - 3} abonos más
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
        {/* Formulario */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Nueva meta</Text>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej: Vacaciones, Fondo de emergencia..."
          />
          <Text style={styles.label}>Monto objetivo (S/.)</Text>
          <TextInput
            style={styles.input}
            value={objetivo}
            onChangeText={setObjetivo}
            keyboardType="numeric"
            placeholder="5000"
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
                if (Platform.OS === "android") setMostrarCal(false);
                if (selected) setFecha(selected);
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

        {/* TabBar manual */}
        <View style={styles.tabBarContainer}>
          {routes.map((route, i) => {
            const isActive = tabIndex === i;
            const count =
              route.key === "activas"
                ? metasActivas.length
                : route.key === "cumplidas"
                  ? metasCumplidas.length
                  : metasVencidas.length;
            return (
              <TouchableOpacity
                key={route.key}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => setTabIndex(i)}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <Text
                    style={[styles.tabLabel, isActive && styles.tabLabelActive]}
                  >
                    {route.title}
                  </Text>
                  {count > 0 && (
                    <View
                      style={[
                        styles.badgeCount,
                        { backgroundColor: isActive ? "#185FA5" : "#ccc" },
                      ]}
                    >
                      <Text style={styles.badgeCountText}>{count}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Contenido según pestaña activa */}
        <View
          style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
        >
          {tabIndex === 0 &&
            (metasActivas.length === 0 ? (
              <Text style={styles.empty}>Sin metas activas</Text>
            ) : (
              metasActivas.map((g) => renderMeta(g))
            ))}
          {tabIndex === 1 &&
            (metasCumplidas.length === 0 ? (
              <Text style={styles.empty}>Sin metas cumplidas aún 💪</Text>
            ) : (
              metasCumplidas.map((g) => renderMeta(g, true))
            ))}
          {tabIndex === 2 &&
            (metasVencidas.length === 0 ? (
              <Text style={styles.empty}>Sin metas vencidas</Text>
            ) : (
              <>
                {vencidasMostradas.map((g) => renderMeta(g, true))}
                {metasVencidas.length > 5 && (
                  <TouchableOpacity
                    style={styles.verMasBtn}
                    onPress={() => setVerTodasVencidas(!verTodasVencidas)}
                  >
                    <Text style={styles.verMasText}>
                      {verTodasVencidas
                        ? "Ver menos ▲"
                        : `Ver ${metasVencidas.length - 5} más ▼`}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  card: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
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
  // TabBar
  tabBarContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e0e0e0",
    marginTop: 12,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabItemActive: { borderBottomColor: "#185FA5" },
  tabLabel: { fontSize: 13, fontWeight: "600", color: "#888" },
  tabLabelActive: { color: "#185FA5" },
  badgeCount: {
    borderRadius: 99,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeCountText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  // Goal cards
  goalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "#e0e0e0",
    marginBottom: 12,
  },
  goalCardVencida: {
    backgroundColor: "#fafafa",
    borderColor: "#e8e8e8",
    opacity: 0.85,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  goalName: { fontSize: 15, fontWeight: "600", color: "#1a1a1a", flex: 1 },
  progressBg: {
    height: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 99,
    overflow: "hidden",
  },
  progressFill: { height: 10, borderRadius: 99 },
  goalMeta: { fontSize: 12, color: "#888", marginTop: 3 },
  badge: {
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    marginBottom: 10,
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
  empty: { textAlign: "center", color: "#bbb", marginTop: 60, fontSize: 14 },
  verMasBtn: { padding: 12, alignItems: "center", marginBottom: 8 },
  verMasText: { fontSize: 13, color: "#185FA5", fontWeight: "500" },
});
