import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

interface Props {
  onGuardar: (nombre: string) => void;
}

export function OnboardingNombre({ onGuardar }: Props) {
  const [valor, setValor] = useState("");

  const saludo = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Buenos días";
    if (h >= 12 && h < 19) return "Buenas tardes";
    return "Buenas noches";
  };

  const listo = valor.trim().length >= 2;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.card}>
        <Text style={styles.emoji}>👋</Text>
        <Text style={styles.titulo}>{saludo()}</Text>
        <Text style={styles.sub}>
          ¿Cómo te llamas? Lo usaremos para personalizar tu dashboard.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Tu nombre"
          placeholderTextColor="#bbb"
          value={valor}
          onChangeText={setValor}
          autoFocus
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={() => listo && onGuardar(valor)}
          maxLength={30}
        />

        <Pressable
          style={[styles.btn, !listo && styles.btnDisabled]}
          onPress={() => listo && onGuardar(valor)}
          disabled={!listo}
        >
          <Text style={styles.btnText}>Empezar →</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  emoji: { fontSize: 48, marginBottom: 12 },
  titulo: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  input: {
    width: "100%",
    height: 48,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1a1a1a",
    marginBottom: 16,
    backgroundColor: "#fafafa",
  },
  btn: {
    width: "100%",
    height: 48,
    backgroundColor: "#185FA5",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: { backgroundColor: "#c8d8eb" },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
