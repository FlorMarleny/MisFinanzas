import AsyncStorage from "@react-native-async-storage/async-storage";

export async function guardarTransacciones(data) {
  await AsyncStorage.setItem("transacciones", JSON.stringify(data));
}

export async function cargarTransacciones() {
  const data = await AsyncStorage.getItem("transacciones");
  return data ? JSON.parse(data) : [];
}

export async function guardarMetas(data) {
  await AsyncStorage.setItem("metas", JSON.stringify(data));
}

export async function cargarMetas() {
  const data = await AsyncStorage.getItem("metas");
  return data ? JSON.parse(data) : [];
}
