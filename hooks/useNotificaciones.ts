import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function solicitarPermisos(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function programarNotificacionesMeta(
  id: number,
  nombre: string,
  fechaLimite: string,
) {
  await cancelarNotificacionesMeta(id);
  const granted = await solicitarPermisos();
  if (!granted) return;

  const deadline = new Date(`${fechaLimite}T23:59:00`);
  const now = new Date();

  const unDiaAntes = new Date(deadline);
  unDiaAntes.setDate(unDiaAntes.getDate() - 1);
  unDiaAntes.setHours(9, 0, 0, 0);
  if (unDiaAntes > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: `meta_${id}_dia`,
      content: {
        title: "⏰ Mañana vence tu meta",
        body: `"${nombre}" vence mañana. ¡Último día para abonar!`,
        data: { metaId: id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: unDiaAntes,
      },
    });
  }

  const unaHoraAntes = new Date(deadline);
  unaHoraAntes.setHours(unaHoraAntes.getHours() - 1);
  if (unaHoraAntes > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: `meta_${id}_hora`,
      content: {
        title: "🔔 ¡Falta 1 hora!",
        body: `La meta "${nombre}" vence en 1 hora.`,
        data: { metaId: id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: unaHoraAntes,
      },
    });
  }

  const diaD = new Date(`${fechaLimite}T08:00:00`);
  if (diaD > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: `meta_${id}_diad`,
      content: {
        title: "📅 Hoy vence tu meta",
        body: `"${nombre}" vence hoy. ¿Llegaste al objetivo?`,
        data: { metaId: id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: diaD,
      },
    });
  }
}

export async function cancelarNotificacionesMeta(id: number) {
  await Notifications.cancelScheduledNotificationAsync(`meta_${id}_dia`);
  await Notifications.cancelScheduledNotificationAsync(`meta_${id}_hora`);
  await Notifications.cancelScheduledNotificationAsync(`meta_${id}_diad`);
}
