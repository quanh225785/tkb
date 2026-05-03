import * as XLSX from "xlsx";
import { DAYS, TIME_SLOTS } from "./constants";

function toLocalPeriod(period) {
  const p = parseInt(period);
  if (p >= 7 && p <= 12) return p - 6;
  return p;
}

function getKipLabel(period) {
  const p = parseInt(period);
  if (p >= 1 && p <= 6) return "Sáng";
  if (p >= 7 && p <= 12) return "Chiều";
  return "";
}

export function exportToExcel(selectedClasses) {
  const wb = XLSX.utils.book_new();

  // === Sheet 1: Danh sách môn đã chọn ===
  const listData = [
    [
      "STT",
      "Mã HP",
      "Tên môn học",
      "Mã lớp",
      "Số TC",
      "Giảng viên",
      "Lịch học",
      "Phòng",
      "Tuần học",
      "CT Đào tạo",
    ],
  ];

  selectedClasses.forEach((cls, idx) => {
    const scheduleStr = cls.schedule
      .map(
        (s) =>
          `Thứ ${s.thu} (${getKipLabel(s.tietBD)}), Tiết ${toLocalPeriod(s.tietBD)}-${toLocalPeriod(s.tietBD + s.soTiet - 1)}`,
      )
      .join("; ");

    const phongStr = cls.schedule
      .map((s) => s.phong)
      .filter(Boolean)
      .join("; ");
    const tuanStr = cls.schedule
      .map((s) => s.tuanHoc)
      .filter(Boolean)
      .join("; ");

    listData.push([
      idx + 1,
      cls.maHP,
      cls.tenHP,
      cls.maLop,
      cls.soTC,
      cls.giangVien,
      scheduleStr,
      phongStr,
      tuanStr,
      cls.cnDaoTao,
    ]);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(listData);
  ws1["!cols"] = [
    { wch: 5 },
    { wch: 12 },
    { wch: 35 },
    { wch: 15 },
    { wch: 8 },
    { wch: 25 },
    { wch: 30 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, "Danh sách môn");

  // === Sheet 2: Thời khóa biểu dạng lưới ===
  const dayHeaders = DAYS.map((d) => d.label);
  const gridData = [["Kíp", "Tiết", "Thời gian", ...dayHeaders]];

  // Build a lookup map
  const timetableMap = {};
  const classColors = {};
  selectedClasses.forEach((cls, idx) => {
    cls.schedule.forEach((slot) => {
      for (let p = slot.tietBD; p < slot.tietBD + slot.soTiet; p++) {
        const key = `${slot.thu}-${p}`;
        timetableMap[key] = `${cls.tenHP}\n(${cls.maLop})\n${slot.phong || ""}`;
      }
    });
  });

  TIME_SLOTS.forEach(({ period, time }) => {
    const row = [getKipLabel(period), toLocalPeriod(period), time];
    DAYS.forEach((day) => {
      const key = `${day.id}-${period}`;
      row.push(timetableMap[key] || "");
    });
    gridData.push(row);
  });

  const ws2 = XLSX.utils.aoa_to_sheet(gridData);
  ws2["!cols"] = [
    { wch: 8 },
    { wch: 6 },
    { wch: 15 },
    ...DAYS.map(() => ({ wch: 25 })),
  ];
  ws2["!rows"] = gridData.map(() => ({ hpt: 50 }));
  XLSX.utils.book_append_sheet(wb, ws2, "Thời khóa biểu");

  // Save file
  const fileName = `TKB_${new Date().toLocaleDateString("vi-VN").replace(/\//g, "-")}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportToJSON(selectedClasses) {
  const data = JSON.stringify(selectedClasses, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `TKB_${new Date().toLocaleDateString("vi-VN").replace(/\//g, "-")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (Array.isArray(data)) {
          resolve(data);
        } else {
          reject(new Error("File JSON không hợp lệ"));
        }
      } catch (err) {
        reject(new Error("Lỗi đọc file JSON: " + err.message));
      }
    };
    reader.onerror = () => reject(new Error("Không thể đọc file"));
    reader.readAsText(file);
  });
}
