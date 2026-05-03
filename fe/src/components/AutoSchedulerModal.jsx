import React, { useState, useMemo } from "react";
import { generateSchedules } from "../utils/autoScheduler";
import TimetableGrid from "./TimetableGrid";
import { CLASS_COLORS } from "../utils/constants";

export default function AutoSchedulerModal({
  mySubjects,
  currentSelected,
  onApply,
  onClose,
}) {
  const [daysOff, setDaysOff] = useState([]);
  const [results, setResults] = useState([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [viewIndex, setViewIndex] = useState(0);

  // Map các lớp đang chọn làm lớp "Ghim"
  const pinnedClasses = {};
  Object.values(currentSelected).forEach((cls) => {
    pinnedClasses[cls.maHP] = cls.id;
  });

  const toggleDayOff = (day) => {
    setDaysOff((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleGenerate = () => {
    const schedules = generateSchedules(mySubjects, { daysOff, pinnedClasses });
    setResults(schedules);
    setHasGenerated(true);
    setViewIndex(0);
  };

  const handleApply = () => {
    if (results.length > 0 && results[viewIndex]) {
      onApply(results[viewIndex].schedule);
      onClose();
    }
  };

  const previewSchedule = results[viewIndex]?.schedule || [];

  // Tạo colorMap cho TimetableGrid preview
  const colorMap = useMemo(() => {
    const map = {};
    previewSchedule.forEach((cls, i) => {
      map[cls.id] = CLASS_COLORS[i % CLASS_COLORS.length];
    });
    return map;
  }, [previewSchedule]);

  return (
    <div className="payment-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="as-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="as-modal-header">
          <div className="as-header-icon">🤖</div>
          <div style={{ flex: 1 }}>
            <h2 className="as-title">Tự động xếp lịch</h2>
            <p className="as-subtitle">Tìm các tổ hợp môn không trùng giờ</p>
          </div>
          <button className="payment-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="as-body">
          {!hasGenerated ? (
            <div className="as-setup">
              <div className="as-section">
                <h3>📌 Các lớp đã Ghim (Giữ nguyên)</h3>
                {Object.keys(pinnedClasses).length === 0 ? (
                  <p className="as-hint">
                    Bạn chưa chọn môn nào ở Bước 2. Thuật toán sẽ tự chọn tất
                    cả.
                  </p>
                ) : (
                  <p className="as-hint">
                    Hệ thống sẽ ép buộc xếp lịch xoay quanh{" "}
                    {Object.keys(pinnedClasses).length} môn bạn đã chọn ngoài
                    kia.
                  </p>
                )}
              </div>

              <div className="as-section">
                <h3>🏖️ Chọn ngày muốn nghỉ (Tuỳ chọn)</h3>
                <div className="as-days-picker">
                  {[2, 3, 4, 5, 6, 7].map((day) => (
                    <button
                      key={day}
                      className={`as-day-btn ${daysOff.includes(day) ? "active" : ""}`}
                      onClick={() => toggleDayOff(day)}
                    >
                      Thứ {day}
                    </button>
                  ))}
                </div>
                <p
                  className="as-hint"
                  style={{ marginTop: "8px", fontStyle: "italic" }}
                >
                  Lưu ý: Nếu chọn quá nhiều ngày nghỉ, hệ thống có thể không tìm
                  ra cách xếp nào.
                </p>
              </div>

              <button
                className="payment-btn primary"
                onClick={handleGenerate}
                style={{ marginTop: "20px", width: "100%", padding: "12px" }}
              >
                🚀 Bắt đầu tạo lịch
              </button>
            </div>
          ) : (
            <div className="as-results">
              {results.length === 0 ? (
                <div className="as-empty">
                  <h3>Không tìm thấy cách xếp nào! 😢</h3>
                  <p>
                    Vui lòng nới lỏng điều kiện (bớt ngày nghỉ) hoặc huỷ ghim
                    một số lớp.
                  </p>
                  <button
                    className="payment-btn secondary"
                    onClick={() => setHasGenerated(false)}
                    style={{ marginTop: "20px" }}
                  >
                    Quay lại
                  </button>
                </div>
              ) : (
                <div className="as-carousel">
                  <h3 className="as-result-count">
                    Tìm thấy <span className="highlight">{results.length}</span>{" "}
                    cách xếp hợp lệ
                  </h3>

                  <div className="as-preview-card">
                    <div className="as-preview-header">
                      <button
                        className="as-nav-btn"
                        disabled={viewIndex === 0}
                        onClick={() => setViewIndex((prev) => prev - 1)}
                      >
                        ◀
                      </button>
                      <div className="as-preview-meta">
                        <strong>Phương án #{viewIndex + 1}</strong>
                        <span className="as-score-badge">
                          Điểm tối ưu: {results[viewIndex].score}
                        </span>
                      </div>
                      <button
                        className="as-nav-btn"
                        disabled={viewIndex === results.length - 1}
                        onClick={() => setViewIndex((prev) => prev + 1)}
                      >
                        ▶
                      </button>
                    </div>

                    <div className="as-preview-stats">
                      <span>
                        🎒 Đi học:{" "}
                        <strong>
                          {results[viewIndex].daysWithClasses} ngày
                        </strong>
                      </span>
                      <span>
                        ⏱️ Lỗ hổng kíp:{" "}
                        <strong>{results[viewIndex].gapPeriods} kíp</strong>
                      </span>
                    </div>

                    <div className="as-preview-grid-wrapper">
                      <TimetableGrid
                        selectedClasses={previewSchedule}
                        colorMap={colorMap}
                        compact
                      />
                    </div>
                  </div>

                  <div className="as-actions">
                    <button
                      className="payment-btn secondary"
                      onClick={() => setHasGenerated(false)}
                    >
                      ◀ Tuỳ chỉnh lại
                    </button>
                    <button
                      className="payment-btn primary"
                      onClick={handleApply}
                    >
                      ✨ Áp dụng Lịch Này
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
