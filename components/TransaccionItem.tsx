import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const ICONS: Record<string, string> = {
  Comida: "🍽",
  Transporte: "🚌",
  Salud: "💊",
  Entretenimiento: "🎬",
  Vivienda: "🏠",
  Educación: "📚",
  Ropa: "👕",
  Servicios: "⚡",
  Salario: "💼",
  Freelance: "💻",
  Inversión: "📈",
  Bono: "🎁",
  Otro: "📦",
};

interface Props {
  item: any;
  onDelete: (id: number) => void;
}

export default function TransaccionItem({ item, onDelete }: Props) {
  const esIngreso = item.type === "income";
  return (
    <View style={styles.item}>
      <Text style={styles.icon}>{ICONS[item.category] || "📦"}</Text>
      <View style={styles.info}>
        <Text style={styles.desc}>{item.desc || item.category}</Text>
        <Text style={styles.meta}>
          {item.category} · {item.account} · {item.date}
        </Text>
        {item.tags?.length > 0 && (
          <View style={styles.tagsRow}>
            {item.tags.map((t: string, i: number) => (
              <Text key={i} style={styles.tag}>
                {t}
              </Text>
            ))}
          </View>
        )}
      </View>
      <View style={styles.right}>
        <Text
          style={[styles.amount, { color: esIngreso ? "#1D9E75" : "#D85A30" }]}
        >
          {esIngreso ? "+" : "−"}S/.{" "}
          {Number(item.amount).toLocaleString("es-CO")}
        </Text>
        <TouchableOpacity onPress={() => onDelete(item.id)}>
          <Text style={styles.del}>×</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: "#e0e0e0",
  },
  icon: { fontSize: 28, marginRight: 12 },
  info: { flex: 1 },
  desc: { fontSize: 14, fontWeight: "500", color: "#1a1a1a" },
  meta: { fontSize: 12, color: "#888", marginTop: 2 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  tag: {
    fontSize: 11,
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    color: "#555",
  },
  right: { alignItems: "flex-end", gap: 4 },
  amount: { fontSize: 14, fontWeight: "600" },
  del: { fontSize: 20, color: "#ccc" },
});
