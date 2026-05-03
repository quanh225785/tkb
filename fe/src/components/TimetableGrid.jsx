import React, { useMemo } from "react";
import { X, MapPin, User } from "lucide-react";
import { DAYS, TIME_SLOTS } from "../utils/constants";
import { buildTimetableMap } from "../utils/timetableUtils";

const SESSION_GROUPS = [
  {
    label: "Sáng",
    periods: [1, 2, 3, 4, 5, 6],
    color: "var(--amber)",
    displayOffset: 0,
  },
  {
    label: "Chiều",
    periods: [7, 8, 9, 10, 11, 12],
    color: "var(--cyan)",
    displayOffset: -6,
  },
];

const COLORS = [
  "#93C5FD",
  "#6EE7B7",
  "#C4B5FD",
  "#FDE68A",
  "#FDA4AF",
  "#F9A8D4",
  "#67E8F9",
  "#BEF264",
  "#FDBA74",
  "#A5B4FC",
  "#5EEAD4",
  "#F0ABFC",
];

function parseTimeRange(timeStr) {
  const match = String(timeStr || "").match(/(\d{2}:\d{2}).*?(\d{2}:\d{2})/);
  if (!match) return null;
  return { start: match[1], end: match[2] };
}

function getTimeRangeForSlot(slot) {
  if (!slot) return null;
  const startPeriod = slot.tietBD;
  const endPeriod = slot.tietBD + slot.soTiet - 1;

  const startRange = parseTimeRange(
    TIME_SLOTS.find((t) => t.period === startPeriod)?.time,
  );
  const endRange = parseTimeRange(
    TIME_SLOTS.find((t) => t.period === endPeriod)?.time,
  );
  const start = startRange?.start;
  const end = endRange?.end;

  if (!start || !end) return null;
  return `${start}–${end}`;
}

export default function TimetableGrid({
  selectedClasses,
  colorMap,
  onRemoveClass,
  onRemoveAll,
  compact = false,
}) {
  const timetableMap = useMemo(
    () => buildTimetableMap(selectedClasses),
    [selectedClasses],
  );

  if (selectedClasses.length === 0) {
    return (
      <div className={`tkb-wrap ${compact ? "tkb-compact" : ""}`}>
        <div className="tkb-empty">
          <img
            className="tkb-empty-gif"
            src="https://media2.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3dzdiZDRwbGltZ3JwdnIzZ3F0bHU1NWRtb3F4YzV2bXg0dTVrYzl4dyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/JA1kmF8xsLQCm2qMcA/200.webp"
            alt="Empty timetable"
            loading="lazy"
            decoding="async"
          />
          <h3>Thời khóa biểu</h3>
          <p>Chọn lớp bên trái để xem lịch hiển thị ở đây</p>
        </div>
        {/* Empty ghost grid */}
        <div className="timetable-scroll">
          <table className="timetable-table">
            <thead>
              <tr>
                <th className="th-session" />
                <th className="th-period">Tiết</th>
                <th className="th-time">Giờ</th>
                {DAYS.map((d) => (
                  <th key={d.id} className="th-day">
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SESSION_GROUPS.map((sg) =>
                sg.periods.map((p, pi) => {
                  const ts = TIME_SLOTS.find((t) => t.period === p);
                  const displayPeriod = p + (sg.displayOffset || 0);
                  return (
                    <tr key={p} className={pi === 0 ? "session-start" : ""}>
                      {pi === 0 && (
                        <td
                          className="td-session"
                          rowSpan={sg.periods.length}
                          style={{ borderLeftColor: sg.color }}
                        >
                          <span
                            className="session-label"
                            style={{ color: sg.color }}
                          >
                            {sg.label}
                          </span>
                        </td>
                      )}
                      <td className="td-period">{displayPeriod}</td>
                      <td className="td-time">{ts?.time}</td>
                      {DAYS.map((d) => (
                        <td key={d.id} className="td-class empty" />
                      ))}
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className={`tkb-wrap ${compact ? "tkb-compact" : ""}`}>
      {/* Legend */}
      {!compact && (
        <div className="tkb-legend">
          {onRemoveAll && (
            <button className="leg-clear" type="button" onClick={onRemoveAll}>
              Xóa tất cả
            </button>
          )}
          {selectedClasses.map((cls, idx) => {
            const colorObj = colorMap?.[cls.id];
            const color = colorObj?.bg || COLORS[idx % 12];
            return (
              <div key={cls.id} className="leg-item">
                <span className="leg-dot" style={{ background: color }} />
                <span className="leg-text">
                  {cls.tenHP} · {cls.maLop}
                </span>
                {onRemoveClass && (
                  <button
                    className="leg-rm"
                    type="button"
                    onClick={() => onRemoveClass(cls.id)}
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Grid */}
      <div className="timetable-scroll">
        <table className="timetable-table">
          <thead>
            <tr>
              <th className="th-session" />
              <th className="th-period">Tiết</th>
              <th className="th-time">Giờ</th>
              {DAYS.map((d) => (
                <th key={d.id} className="th-day">
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SESSION_GROUPS.map((sg) =>
              sg.periods.map((period, pi) => {
                const ts = TIME_SLOTS.find((t) => t.period === period);
                const displayPeriod = period + (sg.displayOffset || 0);
                return (
                  <tr key={period} className={pi === 0 ? "session-start" : ""}>
                    {pi === 0 && (
                      <td
                        className="td-session"
                        rowSpan={sg.periods.length}
                        style={{ borderLeftColor: sg.color }}
                      >
                        <span
                          className="session-label"
                          style={{ color: sg.color }}
                        >
                          {sg.label}
                        </span>
                      </td>
                    )}
                    <td className="td-period">{displayPeriod}</td>
                    <td className="td-time">{ts?.time}</td>

                    {DAYS.map((day) => {
                      const cell = timetableMap[day.id]?.[period];
                      if (!cell)
                        return <td key={day.id} className="td-class empty" />;
                      if (!cell.isStart) return null;

                      const idx = selectedClasses.findIndex(
                        (c) => c.id === cell.class.id,
                      );
                      const colorObj = colorMap?.[cell.class.id];
                      const color = colorObj?.bg || COLORS[idx % 12];
                      const light = colorObj?.light || `${color}33`;
                      const border = colorObj?.border || color;
                      const timeRange = getTimeRangeForSlot(cell.slot);

                      return (
                        <td
                          key={day.id}
                          className="td-class filled"
                          rowSpan={cell.rowspan}
                          style={{
                            background: light,
                            borderLeft: `4px solid ${border}`,
                          }}
                        >
                          <div className="cell-inner">
                            <div
                              className="cell-name"
                              style={{ color: border }}
                            >
                              {cell.class.tenHP}
                            </div>
                            <div className="cell-code">{cell.class.maLop}</div>
                            {timeRange && (
                              <div className="cell-time">{timeRange}</div>
                            )}
                            {cell.slot?.phong && (
                              <div className="cell-room">
                                <MapPin size={9} />
                                {cell.slot.phong}
                              </div>
                            )}
                            {cell.class.giangVien && (
                              <div className="cell-lect">
                                <User size={9} />
                                {cell.class.giangVien}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              }),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
