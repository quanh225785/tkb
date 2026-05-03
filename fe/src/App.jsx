import React, { useState, useCallback, useMemo } from "react";
import Header from "./components/Header";
import FileUpload from "./components/FileUpload";
import SubjectPicker from "./components/SubjectPicker";
import ClassPicker from "./components/ClassPicker";
import TimetableGrid from "./components/TimetableGrid";
import GuideModal from "./components/GuideModal";
import Notification from "./components/Notification";
import PaymentPage from "./components/PaymentPage";
import AutoSchedulerModal from "./components/AutoSchedulerModal";
import { parseExcelFile } from "./utils/excelParser";
import {
  saveToStorage,
  loadFromStorage,
  loadAllClassesFromStorage,
  loadSubjectCodesFromStorage,
  clearStorage,
  getStorageMeta,
} from "./utils/storage";
import { exportToExcel, importFromJSON } from "./utils/exportUtils";
import { checkConflict } from "./utils/timetableUtils";
import { CLASS_COLORS } from "./utils/constants";
import "./App.css";

let notifId = 0;

export default function App() {
  // step: 'upload' | 'subjects' | 'schedule'
  const [step, setStep] = useState("upload");
  const [allClasses, setAllClasses] = useState([]);
  const [fileName, setFileName] = useState("");
  const [mySubjectCodes, setMySubjectCodes] = useState(new Set());
  const [selectedClasses, setSelectedClasses] = useState({}); // {maHP: classObj}
  const [showGuide, setShowGuide] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const [showAutoScheduler, setShowAutoScheduler] = useState(false);

  const [pickerWidth, setPickerWidth] = useState(() => {
    try {
      const raw = window.localStorage.getItem("tkb:pickerWidth");
      const n = raw ? parseInt(raw, 10) : 380;
      if (!Number.isFinite(n)) return 380;
      return Math.min(760, Math.max(320, n));
    } catch {
      return 380;
    }
  });

  const importJsonRef = React.useRef(null);

  const startResizePicker = useCallback(
    (e) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = pickerWidth;
      let nextWidth = startWidth;

      const prevCursor = document.body.style.cursor;
      const prevUserSelect = document.body.style.userSelect;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

      const onMove = (ev) => {
        nextWidth = clamp(startWidth + (ev.clientX - startX), 320, 760);
        setPickerWidth(nextWidth);
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        document.body.style.cursor = prevCursor;
        document.body.style.userSelect = prevUserSelect;
        try {
          window.localStorage.setItem("tkb:pickerWidth", String(nextWidth));
        } catch {
          // ignore
        }
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [pickerWidth],
  );

  const addNotif = useCallback((message, type = "info", duration = 3000) => {
    const id = ++notifId;
    setNotifications((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const handleClearSavedData = useCallback(() => {
    clearStorage();
    setSelectedClasses({});
    addNotif("Đã xóa dữ liệu đã lưu trên máy", "success", 2500);
  }, [addNotif]);

  const dismissNotif = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Group allClasses → unique subjects
  const allSubjects = useMemo(() => {
    const map = {};
    allClasses.forEach((cls) => {
      const key = cls.maHP;
      if (!map[key]) {
        map[key] = {
          maHP: cls.maHP,
          tenHP: cls.tenHP,
          tenHPEn: cls.tenHPEn,
          soTC: cls.soTC,
          loaiHP: cls.loaiHP,
          sections: [],
        };
      }
      map[key].sections.push(cls);
    });
    return Object.values(map);
  }, [allClasses]);

  // Subjects the user picked in step 1
  const mySubjects = useMemo(
    () => allSubjects.filter((s) => mySubjectCodes.has(s.maHP)),
    [allSubjects, mySubjectCodes],
  );

  // Selected classes as array for TimetableGrid
  const selectedArray = useMemo(
    () => Object.values(selectedClasses),
    [selectedClasses],
  );

  // Color map
  const colorMap = useMemo(() => {
    const map = {};
    selectedArray.forEach((cls, i) => {
      map[cls.id] = CLASS_COLORS[i % CLASS_COLORS.length];
    });
    return map;
  }, [selectedArray]);

  const handleFileLoaded = useCallback(
    async (file) => {
      const classes = await parseExcelFile(file);
      setAllClasses(classes);
      setFileName(file.name);
      setMySubjectCodes(new Set());
      setSelectedClasses({});
      setStep("subjects");
      addNotif(`Đã tải ${classes.length} lớp học từ "${file.name}"`, "success");
    },
    [addNotif],
  );

  const handleClearFile = useCallback(() => {
    setAllClasses([]);
    setFileName("");
    setMySubjectCodes(new Set());
    setSelectedClasses({});
    setStep("upload");
  }, []);

  // Step 1 → Step 2
  const handleConfirmSubjects = useCallback(
    (codes) => {
      if (codes.size === 0) {
        addNotif("Hãy chọn ít nhất 1 môn học", "warning");
        return;
      }
      setMySubjectCodes(codes);
      // Remove selected classes not in new subject list
      setSelectedClasses((prev) => {
        const next = {};
        Object.entries(prev).forEach(([k, v]) => {
          if (codes.has(k)) next[k] = v;
        });
        return next;
      });
      setStep("schedule");
      addNotif(`Đã chọn ${codes.size} môn. Bắt đầu xếp lịch!`, "success");
    },
    [addNotif],
  );

  // Pick/unpick a class in step 2
  const handleSelectClass = useCallback(
    (cls) => {
      const maHP = cls.maHP;
      const prev = selectedClasses;

      if (prev[maHP]?.id === cls.id) {
        const next = { ...prev };
        delete next[maHP];
        setSelectedClasses(next);
        addNotif(`Bỏ chọn: ${cls.tenHP}`, "info", 2000);
        return;
      }

      const conflicts = checkConflict(cls, Object.values(prev));
      if (conflicts.length > 0) {
        addNotif(
          `⚠️ Trùng lịch với: ${conflicts.map((c) => c.conflictWith.tenHP).join(", ")}`,
          "warning",
          4000,
        );
      }

      setSelectedClasses({ ...prev, [maHP]: cls });
      addNotif(`✓ Chọn: ${cls.tenHP} (${cls.maLop})`, "success", 2000);
    },
    [selectedClasses, addNotif],
  );

  const handleRemoveClassById = useCallback(
    (classId) => {
      const entry = Object.entries(selectedClasses).find(
        ([, v]) => v.id === classId,
      );
      if (!entry) return;
      const next = { ...selectedClasses };
      delete next[entry[0]];
      setSelectedClasses(next);
      addNotif("Đã bỏ chọn lớp", "info", 2000);
    },
    [selectedClasses, addNotif],
  );

  const handleSave = useCallback(() => {
    const ok = saveToStorage(selectedClasses, allClasses, mySubjectCodes);
    addNotif(
      ok
        ? `Đã lưu ${Object.keys(selectedClasses).length} môn học`
        : "Lưu thất bại",
      ok ? "success" : "error",
    );
  }, [selectedClasses, allClasses, mySubjectCodes, addNotif]);

  const handleExport = useCallback(() => {
    if (selectedArray.length === 0) {
      addNotif("Chưa chọn lớp nào", "warning");
      return;
    }
    try {
      exportToExcel(selectedArray);
      addNotif("Xuất Excel thành công!", "success");
    } catch (err) {
      addNotif("Lỗi: " + err.message, "error");
    }
  }, [selectedArray, addNotif]);

  const handleImportJSON = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const data = await importFromJSON(file);
        // data might be array or object
        const obj = Array.isArray(data)
          ? Object.fromEntries(data.map((c) => [c.maHP, c]))
          : data;
        setSelectedClasses(obj);
        addNotif(`Nhập thành công ${Object.keys(obj).length} môn`, "success");
      } catch (err) {
        addNotif("Lỗi nhập: " + err.message, "error");
      }
      e.target.value = "";
    },
    [addNotif],
  );

  const selectedCount = selectedArray.length;
  const hasSavedData = !!getStorageMeta();

  return (
    <div className="app">
      <Header
        step={step}
        setStep={setStep}
        selectedCount={selectedCount}
        mySubjectsCount={mySubjectCodes.size}
        onExport={handleExport}
        onSave={handleSave}
        onImport={() => importJsonRef.current?.click()}
        onShowGuide={() => setShowGuide(true)}
        onPayment={() => setShowPayment(true)}
        hasSavedData={hasSavedData}
        hasFile={allClasses.length > 0}
        fileName={fileName}
      />

      <main
        className={`main-content${step === "schedule" ? " full-bleed" : ""}`}
      >
        {step === "upload" && (
          <div className="upload-page">
            <div className="upload-hero">
              <div className="hero-icon">📅</div>
              <h2>Húthút</h2>
              <p>
                Tải file Excel TKB từ EsHUST để bắt đầu lên kế hoạch lịch học
              </p>
              <img
                className="hero-gif"
                src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExZWZhMWJscHN0cXZxZGI4MXZ4Nzh6dnp1aW1kdzJkaGk5bzRvcWYxbyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ppSjX2iP9Ec1ExJRsV/giphy.webp"
                alt="Cute timetable"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="upload-card">
              <FileUpload
                onFileLoaded={handleFileLoaded}
                fileName={fileName}
                classCount={allClasses.length}
                onClear={handleClearFile}
              />
            </div>
            <div className="upload-links">
              <a
                href="https://eshust.hust.edu.vn"
                target="_blank"
                rel="noopener noreferrer"
              >
                🔗 Tải TKB tại EsHUST
              </a>
              <span className="sep">·</span>
              <button className="btn-text" onClick={() => setShowGuide(true)}>
                📖 Xem hướng dẫn
              </button>
              <span className="sep">·</span>
              <button
                className="btn-text"
                onClick={() => importJsonRef.current?.click()}
              >
                📥 Nhập JSON
              </button>
              {hasSavedData && (
                <>
                  <span className="sep">·</span>
                  <button
                    className="btn-text"
                    onClick={() => {
                      const saved = loadFromStorage();
                      if (saved) {
                        setSelectedClasses(saved);
                        // Restore allClasses và mySubjectCodes nếu có
                        const savedClasses = loadAllClassesFromStorage();
                        if (savedClasses && savedClasses.length > 0) {
                          setAllClasses(savedClasses);
                        }
                        const savedCodes = loadSubjectCodesFromStorage();
                        if (savedCodes && savedCodes.size > 0) {
                          setMySubjectCodes(savedCodes);
                        } else {
                          // Fallback: tạo mySubjectCodes từ selectedClasses
                          setMySubjectCodes(new Set(Object.keys(saved)));
                        }
                        setStep("schedule");
                        addNotif("Đã mở dữ liệu đã lưu", "success");
                      }
                    }}
                  >
                    💾 Mở bản đã lưu
                  </button>
                  <span className="sep">·</span>
                  <button className="btn-text" onClick={handleClearSavedData}>
                    🗑️ Xóa dữ liệu đã lưu
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {step === "subjects" && (
          <SubjectPicker
            allSubjects={allSubjects}
            initialSelected={mySubjectCodes}
            onConfirm={handleConfirmSubjects}
          />
        )}

        {step === "schedule" && (
          <div
            className="schedule-layout"
            style={{ "--picker-width": `${pickerWidth}px` }}
          >
            <div className="picker-panel">
              <ClassPicker
                mySubjects={mySubjects}
                selectedClasses={selectedClasses}
                colorMap={colorMap}
                onSelectClass={handleSelectClass}
                onBackToSubjects={() => setStep("subjects")}
                onOpenAutoScheduler={() => setShowAutoScheduler(true)}
              />
            </div>
            <div
              className="resize-handle"
              role="separator"
              aria-orientation="vertical"
              onPointerDown={startResizePicker}
            />
            <div className="timetable-panel">
              <TimetableGrid
                selectedClasses={selectedArray}
                colorMap={colorMap}
                onRemoveClass={handleRemoveClassById}
                onRemoveAll={() => {
                  setSelectedClasses({});
                  addNotif("Đã xóa tất cả môn đã chọn", "info", 2500);
                }}
              />
            </div>
          </div>
        )}
      </main>

      <input
        ref={importJsonRef}
        type="file"
        accept=".json"
        style={{ display: "none" }}
        onChange={handleImportJSON}
      />
      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
      {showPayment && (
        <PaymentPage
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            setShowPayment(false);
          }}
          addNotif={addNotif}
        />
      )}
      {showAutoScheduler && (
        <AutoSchedulerModal
          mySubjects={mySubjects}
          currentSelected={selectedClasses}
          onApply={(schedule) => {
            const next = {};
            schedule.forEach(cls => {
              next[cls.maHP] = cls;
            });
            setSelectedClasses(next);
            addNotif(`Đã áp dụng lịch tự động!`, "success", 4000);
          }}
          onClose={() => setShowAutoScheduler(false)}
        />
      )}
      <Notification notifications={notifications} onDismiss={dismissNotif} />
    </div>
  );
}
