export const DAYS = [
  { id: 2, label: "Thứ 2", short: "T2" },
  { id: 3, label: "Thứ 3", short: "T3" },
  { id: 4, label: "Thứ 4", short: "T4" },
  { id: 5, label: "Thứ 5", short: "T5" },
  { id: 6, label: "Thứ 6", short: "T6" },
  { id: 7, label: "Thứ 7", short: "T7" },
];

export const TIME_SLOTS = [
  // Sáng (kíp 1–6)
  { period: 1, time: "06:45–07:30", session: "sang" },
  { period: 2, time: "07:30–08:15", session: "sang" },
  { period: 3, time: "08:25–09:10", session: "sang" },
  { period: 4, time: "09:20–10:05", session: "sang" },
  { period: 5, time: "10:15–11:00", session: "sang" },
  { period: 6, time: "11:00–11:45", session: "sang" },

  // Chiều (kíp 1–6) — dùng period 7–12 để khớp dữ liệu hiện tại
  { period: 7, time: "12:30–13:15", session: "chieu" },
  { period: 8, time: "13:15–14:00", session: "chieu" },
  { period: 9, time: "14:10–14:55", session: "chieu" },
  { period: 10, time: "15:05–15:50", session: "chieu" },
  { period: 11, time: "16:00–16:45", session: "chieu" },
  { period: 12, time: "16:45–17:30", session: "chieu" },
];

export const SESSION_LABELS = {
  sang: "Buổi Sáng",
  chieu: "Buổi Chiều",
  S: "sang",
  C: "chieu",
};

export const CLASS_COLORS = [
  { bg: "#60A5FA", light: "rgba(96,165,250,0.30)", border: "#3B82F6" },
  { bg: "#34D399", light: "rgba(52,211,153,0.30)", border: "#10B981" },
  { bg: "#A78BFA", light: "rgba(167,139,250,0.30)", border: "#8B5CF6" },
  { bg: "#FBBF24", light: "rgba(251,191,36,0.28)", border: "#F59E0B" },
  { bg: "#FB7185", light: "rgba(251,113,133,0.28)", border: "#F43F5E" },
  { bg: "#F472B6", light: "rgba(244,114,182,0.28)", border: "#EC4899" },
  { bg: "#22D3EE", light: "rgba(34,211,238,0.28)", border: "#06B6D4" },
  { bg: "#A3E635", light: "rgba(163,230,53,0.28)", border: "#84CC16" },
  { bg: "#FB923C", light: "rgba(251,146,60,0.28)", border: "#F97316" },
  { bg: "#818CF8", light: "rgba(129,140,248,0.28)", border: "#6366F1" },
  { bg: "#2DD4BF", light: "rgba(45,212,191,0.28)", border: "#14B8A6" },
  { bg: "#E879F9", light: "rgba(232,121,249,0.28)", border: "#D946EF" },
];

export const PROGRAMS = [
  "Tất cả",
  "CT CHUẨN",
  "CT TIÊN TIẾN",
  "CT VIỆT PHÁP",
  "CT ELITECH",
  "CT POHE",
  "CT TÍCH HỢP",
];
