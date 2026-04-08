import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const KEY = "finance_user_name";

export function useUsuario() {
  const [nombre, setNombre] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((val) => {
      setNombre(val);
      setCargando(false);
    });
  }, []);

  const guardarNombre = async (name: string) => {
    const trimmed = name.trim();
    await AsyncStorage.setItem(KEY, trimmed);
    setNombre(trimmed);
  };

  const borrarNombre = async () => {
    await AsyncStorage.removeItem(KEY);
    setNombre(null);
  };

  return { nombre, cargando, guardarNombre, borrarNombre };
}
