import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { cargarTransacciones, guardarTransacciones } from "../../storage/data";

const CATS_GASTO = [
  "Comida",
  "Transporte",
  "Salud",
  "Entretenimiento",
  "Educación",
  "Ropa",
  "Servicios",
  "Otro",
];

const CATS_INGRESO = ["Salario", "Freelance", "Otro"];
const CUENTAS = ["Efectivo", "Yape", "Interbank"];

export default function AgregarScreen() {
  const [esIngreso, setEsIngreso] = useState(false);
  const [monto, setMonto] = useState("");
  const [desc, setDesc] = useState("");
  const [categoria, setCategoria] = useState("Comida");
  const [cuenta, setCuenta] = useState("Efectivo");
  const [tags, setTags] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);

  const cats = esIngreso ? CATS_INGRESO : CATS_GASTO;

  const guardar = async () => {
    if (!monto || isNaN(Number(monto)) || Number(monto) <= 0) {
      Alert.alert("", "Ingresa un monto válido");
      return;
    }
    const existentes = await cargarTransacciones();
    const nueva = {
      id: Date.now(),
      type: esIngreso ? "income" : "expense",
      amount: Number(monto),
      category: categoria,
      account: cuenta,
      desc,
      tags: tags
        ? tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      date: fecha,
    };
    await guardarTransacciones([...existentes, nueva]);
    setMonto("");
    setDesc("");
    setTags("");
    Alert.alert("✅ Guardado", "Movimiento registrado correctamente");
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, !esIngreso && styles.toggleActive]}>
            Gasto
          </Text>
          <Switch
            value={esIngreso}
            onValueChange={(v) => {
              setEsIngreso(v);
              setCategoria(v ? "Salario" : "Comida");
            }}
            trackColor={{ false: "#D85A30", true: "#1D9E75" }}
            thumbColor="#fff"
          />
          <Text style={[styles.toggleLabel, esIngreso && styles.toggleActive]}>
            Ingreso
          </Text>
        </View>

        <Text style={styles.label}>Monto (S/.)</Text>
        <TextInput
          style={styles.input}
          value={monto}
          onChangeText={setMonto}
          keyboardType="numeric"
          placeholder="0"
        />

        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={styles.input}
          value={desc}
          onChangeText={setDesc}
          placeholder="Ej: Almuerzo, salario marzo..."
        />

        <Text style={styles.label}>Categoría</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 14 }}
        >
          <View style={{ flexDirection: "row", gap: 8 }}>
            {cats.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, categoria === c && styles.chipActive]}
                onPress={() => setCategoria(c)}
              >
                <Text
                  style={[
                    styles.chipText,
                    categoria === c && styles.chipTextActive,
                  ]}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.label}>Cuenta / Tarjeta</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 14 }}
        >
          <View style={{ flexDirection: "row", gap: 8 }}>
            {CUENTAS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, cuenta === c && styles.chipActive]}
                onPress={() => setCuenta(c)}
              >
                <Text
                  style={[
                    styles.chipText,
                    cuenta === c && styles.chipTextActive,
                  ]}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.label}>Fecha</Text>
        <TextInput
          style={styles.input}
          value={fecha}
          onChangeText={setFecha}
          placeholder="YYYY-MM-DD"
        />

        <TouchableOpacity
          style={[
            styles.btn,
            { backgroundColor: esIngreso ? "#1D9E75" : "#D85A30" },
          ]}
          onPress={guardar}
        >
          <Text style={styles.btnText}>
            Guardar {esIngreso ? "ingreso" : "gasto"}
          </Text>
        </TouchableOpacity>
      </View>
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
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },
  toggleLabel: { fontSize: 15, color: "#aaa", fontWeight: "500" },
  toggleActive: { color: "#1a1a1a" },
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
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 0.5,
    borderColor: "#ddd",
    backgroundColor: "#f5f5f5",
  },
  chipActive: { backgroundColor: "#1a1a1a", borderColor: "#1a1a1a" },
  chipText: { fontSize: 13, color: "#555" },
  chipTextActive: { color: "#fff", fontWeight: "500" },
  btn: { borderRadius: 10, padding: 14, alignItems: "center", marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
