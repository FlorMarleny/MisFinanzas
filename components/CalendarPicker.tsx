import React, { useCallback, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FilterType } from "../storage/types";

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
const DOW_HEADERS = ["DO", "LU", "MA", "MI", "JU", "VI", "SA"];

interface CalendarPickerProps {
  filter: FilterType;
  onFilter: (f: FilterType) => void;
  datesWithData?: Set<string>;
}

interface DayCell {
  day: number;
  month: number;
  year: number;
  current: boolean;
}

export function CalendarPicker({
  filter,
  onFilter,
  datesWithData = new Set(),
}: CalendarPickerProps) {
  const today = new Date();
  // Normalize today to midnight for accurate comparisons
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"day" | "month">("day");
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const isFutureDay = useCallback(
    (day: number, month: number, year: number): boolean => {
      const d = new Date(year, month, day);
      return d > todayMidnight;
    },
    [todayMidnight],
  );

  const isFutureMonth = useCallback(
    (month: number, year: number): boolean => {
      // A month is "future" if its first day is after today
      const firstOfMonth = new Date(year, month, 1);
      const firstOfCurrentMonth = new Date(
        todayMidnight.getFullYear(),
        todayMidnight.getMonth(),
        1,
      );
      return firstOfMonth > firstOfCurrentMonth;
    },
    [todayMidnight],
  );

  const toDateStr = (day: number, month: number, year: number): string =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  // ─── Navigation ─────────────────────────────────────────────────────────────

  const navigate = (dir: number) => {
    if (mode === "day") {
      let m = viewMonth + dir;
      let y = viewYear;
      if (m < 0) {
        m = 11;
        y--;
      }
      if (m > 11) {
        m = 0;
        y++;
      }
      // Don't navigate to future months in day mode
      const targetFirst = new Date(y, m, 1);
      const currentFirst = new Date(
        todayMidnight.getFullYear(),
        todayMidnight.getMonth(),
        1,
      );
      if (targetFirst <= currentFirst || dir < 0) {
        setViewMonth(m);
        setViewYear(y);
      }
    } else {
      // In month mode only allow going back, or current year
      if (dir < 0 || viewYear < today.getFullYear()) {
        setViewYear((y) => y + dir);
      }
    }
  };

  // ─── Selection ──────────────────────────────────────────────────────────────

  const selectDay = (day: number, month: number, year: number) => {
    if (isFutureDay(day, month, year)) return;
    onFilter({ type: "day", date: toDateStr(day, month, year) });
    setOpen(false);
  };

  const selectMonth = (month: number, year: number) => {
    if (isFutureMonth(month, year)) return;
    onFilter({ type: "month", year, month });
    setOpen(false);
  };

  const clear = () => {
    onFilter(null);
    setOpen(false);
  };

  // ─── Build calendar grid ─────────────────────────────────────────────────────

  const buildDays = (): DayCell[] => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();
    const total = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const cells: DayCell[] = [];

    for (let i = 0; i < total; i++) {
      let day: number;
      let month = viewMonth;
      let year = viewYear;
      let current = true;

      if (i < firstDay) {
        day = daysInPrev - firstDay + i + 1;
        month--;
        if (month < 0) {
          month = 11;
          year--;
        }
        current = false;
      } else if (i >= firstDay + daysInMonth) {
        day = i - firstDay - daysInMonth + 1;
        month++;
        if (month > 11) {
          month = 0;
          year++;
        }
        current = false;
      } else {
        day = i - firstDay + 1;
      }

      cells.push({ day, month, year, current });
    }
    return cells;
  };

  // ─── State checks ────────────────────────────────────────────────────────────

  const isDaySelected = (day: number, month: number, year: number): boolean =>
    filter?.type === "day" && filter.date === toDateStr(day, month, year);

  const isToday = (day: number, month: number, year: number): boolean =>
    todayMidnight.getFullYear() === year &&
    todayMidnight.getMonth() === month &&
    todayMidnight.getDate() === day;

  const dayHasData = (day: number, month: number, year: number): boolean =>
    datesWithData.has(toDateStr(day, month, year));

  const isMonthSelected = (month: number, year: number): boolean =>
    filter?.type === "month" && filter.month === month && filter.year === year;

  // ─── Label for trigger button ────────────────────────────────────────────────

  const filterLabel = (): string => {
    if (!filter) return "Filtrar por fecha";
    if (filter.type === "day") {
      const [, m, d] = filter.date.split("-");
      return `${parseInt(d)} ${MONTHS_SHORT[parseInt(m) - 1]}`;
    }
    return `${MONTHS_SHORT[filter.month]} ${filter.year}`;
  };

  const activeLabel = (): string => {
    if (!filter) return "";
    if (filter.type === "day") {
      const [y, m, d] = filter.date.split("-");
      return `${parseInt(d)} de ${MONTHS_FULL[parseInt(m) - 1]} ${y}`;
    }
    return `${MONTHS_FULL[filter.month]} ${filter.year}`;
  };

  // Can we go forward (next month/year)?
  const canGoForward = (): boolean => {
    if (mode === "day") {
      const next = new Date(viewYear, viewMonth + 1, 1);
      const currentFirst = new Date(
        todayMidnight.getFullYear(),
        todayMidnight.getMonth(),
        1,
      );
      return next <= currentFirst;
    }
    return viewYear < today.getFullYear();
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <View>
      {/* Trigger pill */}
      <TouchableOpacity
        style={[styles.pill, !!filter && styles.pillActive]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={[styles.pillIcon, !!filter && styles.pillTextActive]}>
          📅
        </Text>
        <Text style={[styles.pillText, !!filter && styles.pillTextActive]}>
          {filterLabel()}
        </Text>
      </TouchableOpacity>

      {/* Floating calendar modal */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.calCard} onPress={() => {}}>
            {/* Header navigation */}
            <View style={styles.navRow}>
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => navigate(-1)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.navArrow}>‹</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMode((m) => (m === "day" ? "month" : "day"))}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Text style={styles.navTitle}>
                  {mode === "day"
                    ? `${MONTHS_FULL[viewMonth]} ${viewYear}`
                    : String(viewYear)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.navBtn,
                  !canGoForward() && styles.navBtnDisabled,
                ]}
                onPress={() => canGoForward() && navigate(1)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                disabled={!canGoForward()}
              >
                <Text
                  style={[
                    styles.navArrow,
                    !canGoForward() && styles.navArrowDisabled,
                  ]}
                >
                  ›
                </Text>
              </TouchableOpacity>
            </View>

            {/* Mode tabs */}
            <View style={styles.tabs}>
              {(["day", "month"] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tab, mode === t && styles.tabActive]}
                  onPress={() => setMode(t)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.tabText, mode === t && styles.tabTextActive]}
                  >
                    {t === "day" ? "Día" : "Mes"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Day grid view */}
            {mode === "day" && (
              <View style={styles.gridContainer}>
                {/* Day-of-week headers */}
                <View style={styles.dowRow}>
                  {DOW_HEADERS.map((d) => (
                    <Text key={d} style={styles.dowCell}>
                      {d}
                    </Text>
                  ))}
                </View>

                {/* Day cells */}
                <View style={styles.daysGrid}>
                  {buildDays().map((cell, i) => {
                    const selected = isDaySelected(
                      cell.day,
                      cell.month,
                      cell.year,
                    );
                    const todayCell = isToday(cell.day, cell.month, cell.year);
                    const future = isFutureDay(cell.day, cell.month, cell.year);
                    const hasD = dayHasData(cell.day, cell.month, cell.year);

                    return (
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.dayCell,
                          selected && styles.dayCellSelected,
                          future && styles.dayCellFuture,
                          !cell.current && styles.dayCellOther,
                        ]}
                        onPress={() =>
                          selectDay(cell.day, cell.month, cell.year)
                        }
                        activeOpacity={future ? 1 : 0.7}
                        disabled={future}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            todayCell && styles.dayTextToday,
                            selected && styles.dayTextSelected,
                            future && styles.dayTextFuture,
                            !cell.current && styles.dayTextOther,
                          ]}
                        >
                          {cell.day}
                        </Text>
                        {/* Green dot for days with transactions */}
                        {hasD && !selected && !future && (
                          <View style={styles.dataDot} />
                        )}
                        {/* White dot when selected and has data */}
                        {hasD && selected && (
                          <View
                            style={[styles.dataDot, styles.dataDotSelected]}
                          />
                        )}
                        {/* Today underline dot */}
                        {todayCell && !selected && (
                          <View style={styles.todayDot} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Month grid view */}
            {mode === "month" && (
              <View style={styles.monthsGrid}>
                {MONTHS_SHORT.map((m, i) => {
                  const future = isFutureMonth(i, viewYear);
                  const selected = isMonthSelected(i, viewYear);
                  const isCurrentMonth =
                    today.getMonth() === i && today.getFullYear() === viewYear;

                  return (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.monthCell,
                        selected && styles.monthCellSelected,
                        future && styles.monthCellFuture,
                      ]}
                      onPress={() => selectMonth(i, viewYear)}
                      activeOpacity={future ? 1 : 0.7}
                      disabled={future}
                    >
                      <Text
                        style={[
                          styles.monthText,
                          selected && styles.monthTextSelected,
                          future && styles.monthTextFuture,
                          isCurrentMonth &&
                            !selected &&
                            styles.monthTextCurrent,
                        ]}
                      >
                        {m}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={clear}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={styles.clearBtn}>Limpiar filtro</Text>
              </TouchableOpacity>
              {filter && (
                <Text style={styles.activeLabel} numberOfLines={1}>
                  {activeLabel()}
                </Text>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ACCENT = "#185FA5";
const GREEN = "#1D9E75";
const RED = "#D85A30";

const styles = StyleSheet.create({
  // Trigger pill
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: { elevation: 1 },
    }),
  },
  pillActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  pillIcon: { fontSize: 14 },
  pillText: { fontSize: 13, color: "#888", fontWeight: "500" },
  pillTextActive: { color: "#fff" },

  // Backdrop + card
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.38)",
    justifyContent: "center",
    alignItems: "center",
  },
  calCard: {
    width: 280,
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
      },
      android: { elevation: 12 },
    }),
  },

  // Navigation row
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 8,
  },
  navBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  navBtnDisabled: { opacity: 0.3 },
  navArrow: { fontSize: 24, color: "#555", lineHeight: 28, fontWeight: "300" },
  navArrowDisabled: { color: "#ccc" },
  navTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    letterSpacing: -0.2,
  },

  // Mode tabs
  tabs: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  tabActive: { backgroundColor: ACCENT },
  tabText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#888",
    letterSpacing: 0.4,
  },
  tabTextActive: { color: "#fff" },

  // Day grid
  gridContainer: { paddingHorizontal: 10, paddingBottom: 4 },
  dowRow: { flexDirection: "row", marginBottom: 2 },
  dowCell: {
    flex: 1,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "600",
    color: "#bbb",
    letterSpacing: 0.5,
    paddingVertical: 2,
  },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    position: "relative",
  },
  dayCellSelected: { backgroundColor: ACCENT },
  dayCellFuture: { opacity: 0.28 },
  dayCellOther: { opacity: 0.35 },
  dayText: { fontSize: 12, color: "#444", fontWeight: "400" },
  dayTextToday: { color: ACCENT, fontWeight: "700" },
  dayTextSelected: { color: "#fff", fontWeight: "600" },
  dayTextFuture: { color: "#bbb" },
  dayTextOther: { color: "#bbb" },
  dataDot: {
    position: "absolute",
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: GREEN,
  },
  dataDotSelected: { backgroundColor: "rgba(255,255,255,0.8)" },
  todayDot: {
    position: "absolute",
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: ACCENT,
  },

  // Month grid
  monthsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  monthCell: {
    width: "33.33%",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },
  monthCellSelected: { backgroundColor: ACCENT },
  monthCellFuture: { opacity: 0.28 },
  monthText: { fontSize: 12, color: "#555", fontWeight: "500" },
  monthTextSelected: { color: "#fff", fontWeight: "600" },
  monthTextFuture: { color: "#ccc" },
  monthTextCurrent: { color: ACCENT, fontWeight: "700" },

  // Footer
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderColor: "#f0f0f0",
  },
  clearBtn: { fontSize: 12, color: "#bbb", fontWeight: "500" },
  activeLabel: {
    fontSize: 11,
    color: ACCENT,
    fontWeight: "600",
    maxWidth: 160,
    textAlign: "right",
  },
});
