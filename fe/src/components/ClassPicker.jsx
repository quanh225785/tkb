import React, { useState, useMemo, useCallback } from "react";
import {
  ArrowLeft,
  Clock,
  MapPin,
  User,
  Check,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { DAYS, TIME_SLOTS } from "../utils/constants";
import { checkConflict } from "../utils/timetableUtils";

function toLocalPeriod(period) {
  const p = parseInt(period);
  if (p >= 7 && p <= 12) return p - 6;
  return p;
}

function parseTimeRange(timeStr) {
  const match = String(timeStr || "").match(/(\d{2}:\d{2}).*?(\d{2}:\d{2})/);
  if (!match) return null;
  return { start: match[1], end: match[2] };
}

function ScheduleTag({ slot }) {
  const dayLabel = DAYS.find((d) => d.id === slot.thu)?.short || `T${slot.thu}`;
  const end = slot.tietBD + slot.soTiet - 1;
  const displayStart = toLocalPeriod(slot.tietBD);
  const displayEnd = toLocalPeriod(end);

  const startRange = parseTimeRange(
    TIME_SLOTS.find((t) => t.period === slot.tietBD)?.time,
  );
  const endRange = parseTimeRange(
    TIME_SLOTS.find((t) => t.period === end)?.time,
  );
  const timeRange =
    startRange?.start && endRange?.end
      ? `${startRange.start}–${endRange.end}`
      : null;
  return (
    <span className="sched-tag">
      <Clock size={10} />
      {dayLabel} · {displayStart}–{displayEnd}
      {timeRange ? ` · ${timeRange}` : ""}
      {slot.phong && (
        <>
          <MapPin size={10} />
          {slot.phong}
        </>
      )}
    </span>
  );
}

export default function ClassPicker({
  mySubjects,
  selectedClasses,
  colorMap,
  onSelectClass,
  onBackToSubjects,
}) {
  const [activeIdx, setActiveIdx] = useState(0);

  const [tabsWidth, setTabsWidth] = useState(() => {
    try {
      const raw = window.localStorage.getItem("tkb:tabsWidth");
      const n = raw ? parseInt(raw, 10) : 160;
      if (!Number.isFinite(n)) return 160;
      return Math.min(320, Math.max(120, n));
    } catch {
      return 160;
    }
  });

  const startResizeTabs = useCallback(
    (e) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = tabsWidth;
      let nextWidth = startWidth;

      const prevCursor = document.body.style.cursor;
      const prevUserSelect = document.body.style.userSelect;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

      const onMove = (ev) => {
        nextWidth = clamp(startWidth + (ev.clientX - startX), 120, 320);
        setTabsWidth(nextWidth);
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        document.body.style.cursor = prevCursor;
        document.body.style.userSelect = prevUserSelect;
        try {
          window.localStorage.setItem("tkb:tabsWidth", String(nextWidth));
        } catch {
          // ignore
        }
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [tabsWidth],
  );

  const selectedArray = useMemo(
    () => Object.values(selectedClasses),
    [selectedClasses],
  );
  const doneCount = Object.keys(selectedClasses).length;
  const totalCount = mySubjects.length;

  const activeSubject = mySubjects[activeIdx] || mySubjects[0];

  return (
    <div className="class-picker">
      {/* ── TOP HEADER ── */}
      <div className="cp-header">
        <button className="btn-back" onClick={onBackToSubjects}>
          <ArrowLeft size={14} /> Môn học
        </button>
        <div className="cp-title">
          <span className="step-badge">Bước 2</span>
          Xếp lịch học
        </div>
        <div className="cp-progress">
          <span
            style={{
              fontWeight: 600,
              color: doneCount === totalCount ? "var(--green)" : "var(--text2)",
            }}
          >
            {doneCount}/{totalCount}
          </span>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${totalCount ? (doneCount / totalCount) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ── BODY: 2 columns inside picker ── */}
      <div className="cp-body" style={{ "--tabs-width": `${tabsWidth}px` }}>
        {/* LEFT: subject tab list */}
        <div className="cp-subject-tabs">
          {mySubjects.map((subject, idx) => {
            const chosen = selectedClasses[subject.maHP];
            const colorObj = chosen ? colorMap[chosen.id] : null;
            const color = colorObj?.bg || null;
            const colorText = colorObj?.border || color;
            const isActive = idx === activeIdx;
            return (
              <button
                key={subject.maHP}
                className={`cp-tab ${isActive ? "active" : ""} ${chosen ? "done" : ""}`}
                onClick={() => setActiveIdx(idx)}
              >
                {/* Color dot */}
                <span
                  className="cp-tab-dot"
                  style={{ background: chosen ? color : "var(--bg4)" }}
                />
                <div className="cp-tab-info">
                  <span className="cp-tab-code">{subject.maHP}</span>
                  <span className="cp-tab-name">{subject.tenHP}</span>
                  {chosen && (
                    <span
                      className="cp-tab-chosen"
                      style={{ color: colorText }}
                    >
                      <Check size={9} /> {chosen.maLop}
                    </span>
                  )}
                </div>
                {subject.soTC && (
                  <span className="cp-tab-tc">{subject.soTC}TC</span>
                )}
                <ChevronRight size={12} className="cp-tab-arrow" />
              </button>
            );
          })}
        </div>

        <div
          className="resize-handle"
          role="separator"
          aria-orientation="vertical"
          onPointerDown={startResizeTabs}
        />

        {/* RIGHT: class list for active subject */}
        <div className="cp-class-list">
          {activeSubject && (
            <>
              <div className="cp-class-header">
                <div>
                  <div className="cp-class-code">{activeSubject.maHP}</div>
                  <div className="cp-class-name">{activeSubject.tenHP}</div>
                  {activeSubject.tenHPEn && (
                    <div className="cp-class-name-en">
                      {activeSubject.tenHPEn}
                    </div>
                  )}
                </div>
                <div className="cp-class-meta">
                  {activeSubject.soTC && (
                    <span className="tc-pill">{activeSubject.soTC} TC</span>
                  )}
                  <span className="secs-pill">
                    {activeSubject.sections.length} lớp
                  </span>
                </div>
              </div>

              <div className="cp-cards-scroll">
                {activeSubject.sections.map((cls) => {
                  const isSelected =
                    selectedClasses[activeSubject.maHP]?.id === cls.id;
                  const conflicts = !isSelected
                    ? checkConflict(cls, selectedArray)
                    : [];
                  const hasConflict = conflicts.length > 0;
                  const colorObj = isSelected ? colorMap[cls.id] : null;
                  const color = colorObj?.bg || null;
                  const light = colorObj?.light || null;
                  const border = colorObj?.border || color;

                  return (
                    <button
                      key={cls.id}
                      className={`cc-card ${isSelected ? "selected" : ""} ${hasConflict && !isSelected ? "conflict" : ""}`}
                      style={
                        isSelected
                          ? {
                              borderColor: border,
                              background: light || `${color}22`,
                            }
                          : {}
                      }
                      onClick={() => onSelectClass(cls)}
                    >
                      {/* Left: info */}
                      <div className="cc-left">
                        <div className="cc-top">
                          <span className="cc-lop">{cls.maLop}</span>
                          {isSelected && (
                            <span className="cc-badge selected-b">
                              <Check size={9} /> Đã chọn
                            </span>
                          )}
                          {hasConflict && !isSelected && (
                            <span className="cc-badge conflict-b">
                              <AlertTriangle size={9} /> Trùng lịch
                            </span>
                          )}
                        </div>

                        {/* Schedule */}
                        <div className="cc-sched">
                          {cls.schedule.map((s, i) => (
                            <ScheduleTag key={i} slot={s} />
                          ))}
                        </div>

                        {/* Meta */}
                        <div className="cc-meta">
                          {cls.giangVien && (
                            <span>
                              <User size={10} />
                              {cls.giangVien}
                            </span>
                          )}
                          {cls.cnDaoTao && (
                            <span className="cn">{cls.cnDaoTao}</span>
                          )}
                          {conflicts.length > 0 && !isSelected && (
                            <span style={{ color: "var(--amber)" }}>
                              Trùng:{" "}
                              {conflicts
                                .map((c) => c.conflictWith.tenHP)
                                .join(", ")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: select button */}
                      <div
                        className="cc-select-btn"
                        style={
                          isSelected
                            ? {
                                background: color,
                                borderColor: border,
                                color: "var(--text)",
                              }
                            : {}
                        }
                      >
                        {isSelected ? <Check size={15} /> : <span>+</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
