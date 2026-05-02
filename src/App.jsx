import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import SubjectPicker from './components/SubjectPicker';
import ClassPicker from './components/ClassPicker';
import TimetableGrid from './components/TimetableGrid';
import GuideModal from './components/GuideModal';
import Notification from './components/Notification';
import { parseExcelFile } from './utils/excelParser';
import { saveToStorage, loadFromStorage, getStorageMeta } from './utils/storage';
import { exportToExcel, importFromJSON } from './utils/exportUtils';
import { checkConflict } from './utils/timetableUtils';
import { CLASS_COLORS } from './utils/constants';
import './App.css';

let notifId = 0;

export default function App() {
  // step: 'upload' | 'subjects' | 'schedule'
  const [step, setStep]                   = useState('upload');
  const [allClasses, setAllClasses]       = useState([]);
  const [fileName, setFileName]           = useState('');
  const [mySubjectCodes, setMySubjectCodes] = useState(new Set());
  const [selectedClasses, setSelectedClasses] = useState({}); // {maHP: classObj}
  const [showGuide, setShowGuide]         = useState(false);
  const [notifications, setNotifications] = useState([]);

  const importJsonRef = React.useRef(null);

  useEffect(() => {
    const saved = loadFromStorage();
    if (saved && Object.keys(saved).length > 0) {
      setSelectedClasses(saved);
    }
  }, []);

  const addNotif = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++notifId;
    setNotifications(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const dismissNotif = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Group allClasses → unique subjects
  const allSubjects = useMemo(() => {
    const map = {};
    allClasses.forEach(cls => {
      const key = cls.maHP;
      if (!map[key]) {
        map[key] = { maHP: cls.maHP, tenHP: cls.tenHP, tenHPEn: cls.tenHPEn, soTC: cls.soTC, loaiHP: cls.loaiHP, sections: [] };
      }
      map[key].sections.push(cls);
    });
    return Object.values(map);
  }, [allClasses]);

  // Subjects the user picked in step 1
  const mySubjects = useMemo(() =>
    allSubjects.filter(s => mySubjectCodes.has(s.maHP)),
    [allSubjects, mySubjectCodes]
  );

  // Selected classes as array for TimetableGrid
  const selectedArray = useMemo(() =>
    Object.values(selectedClasses),
    [selectedClasses]
  );

  // Color map
  const colorMap = useMemo(() => {
    const map = {};
    selectedArray.forEach((cls, i) => {
      map[cls.id] = CLASS_COLORS[i % CLASS_COLORS.length];
    });
    return map;
  }, [selectedArray]);

  const handleFileLoaded = useCallback(async (file) => {
    const classes = await parseExcelFile(file);
    setAllClasses(classes);
    setFileName(file.name);
    setMySubjectCodes(new Set());
    setSelectedClasses({});
    setStep('subjects');
    addNotif(`Đã tải ${classes.length} lớp học từ "${file.name}"`, 'success');
  }, [addNotif]);

  const handleClearFile = useCallback(() => {
    setAllClasses([]); setFileName('');
    setMySubjectCodes(new Set()); setSelectedClasses({});
    setStep('upload');
  }, []);

  // Step 1 → Step 2
  const handleConfirmSubjects = useCallback((codes) => {
    if (codes.size === 0) { addNotif('Hãy chọn ít nhất 1 môn học', 'warning'); return; }
    setMySubjectCodes(codes);
    // Remove selected classes not in new subject list
    setSelectedClasses(prev => {
      const next = {};
      Object.entries(prev).forEach(([k, v]) => { if (codes.has(k)) next[k] = v; });
      return next;
    });
    setStep('schedule');
    addNotif(`Đã chọn ${codes.size} môn. Bắt đầu xếp lịch!`, 'success');
  }, [addNotif]);

  // Pick/unpick a class in step 2
  const handleSelectClass = useCallback((cls) => {
    const maHP = cls.maHP;
    setSelectedClasses(prev => {
      if (prev[maHP]?.id === cls.id) {
        const next = { ...prev };
        delete next[maHP];
        addNotif(`Bỏ chọn: ${cls.tenHP}`, 'info', 2000);
        return next;
      }
      const conflicts = checkConflict(cls, Object.values(prev));
      if (conflicts.length > 0) {
        addNotif(`⚠️ Trùng lịch với: ${conflicts.map(c => c.conflictWith.tenHP).join(', ')}`, 'warning', 4000);
      }
      addNotif(`✓ Chọn: ${cls.tenHP} (${cls.maLop})`, 'success', 2000);
      return { ...prev, [maHP]: cls };
    });
  }, [addNotif]);

  const handleSave = useCallback(() => {
    const ok = saveToStorage(selectedClasses);
    addNotif(ok ? `Đã lưu ${Object.keys(selectedClasses).length} môn học` : 'Lưu thất bại', ok ? 'success' : 'error');
  }, [selectedClasses, addNotif]);

  const handleExport = useCallback(() => {
    if (selectedArray.length === 0) { addNotif('Chưa chọn lớp nào', 'warning'); return; }
    try { exportToExcel(selectedArray); addNotif('Xuất Excel thành công!', 'success'); }
    catch (err) { addNotif('Lỗi: ' + err.message, 'error'); }
  }, [selectedArray, addNotif]);

  const handleImportJSON = useCallback(async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const data = await importFromJSON(file);
      // data might be array or object
      const obj = Array.isArray(data)
        ? Object.fromEntries(data.map(c => [c.maHP, c]))
        : data;
      setSelectedClasses(obj);
      addNotif(`Nhập thành công ${Object.keys(obj).length} môn`, 'success');
    } catch (err) { addNotif('Lỗi nhập: ' + err.message, 'error'); }
    e.target.value = '';
  }, [addNotif]);

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
        hasSavedData={hasSavedData}
        hasFile={allClasses.length > 0}
        fileName={fileName}
      />

      <main className={`main-content${step === 'schedule' ? ' full-bleed' : ''}`}>
        {step === 'upload' && (
          <div className="upload-page">
            <div className="upload-hero">
              <div className="hero-icon">📅</div>
              <h2>HUST TKB Planner</h2>
              <p>Tải file Excel TKB từ EsHUST để bắt đầu lên kế hoạch lịch học</p>
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
              <a href="https://eshust.hust.edu.vn" target="_blank" rel="noopener noreferrer">
                🔗 Tải TKB tại EsHUST
              </a>
              <span className="sep">·</span>
              <button className="btn-text" onClick={() => setShowGuide(true)}>📖 Xem hướng dẫn</button>
              <span className="sep">·</span>
              <button className="btn-text" onClick={() => importJsonRef.current?.click()}>📥 Nhập JSON</button>
              {hasSavedData && (
                <>
                  <span className="sep">·</span>
                  <button className="btn-text" onClick={() => {
                    const saved = loadFromStorage();
                    if (saved) { setSelectedClasses(saved); setStep('schedule'); addNotif('Đã mở dữ liệu đã lưu', 'success'); }
                  }}>💾 Mở bản đã lưu</button>
                </>
              )}
            </div>
          </div>
        )}

        {step === 'subjects' && (
          <SubjectPicker
            allSubjects={allSubjects}
            initialSelected={mySubjectCodes}
            onConfirm={handleConfirmSubjects}
          />
        )}

        {step === 'schedule' && (
          <div className="schedule-layout">
            <div className="picker-panel">
              <ClassPicker
                mySubjects={mySubjects}
                selectedClasses={selectedClasses}
                colorMap={colorMap}
                onSelectClass={handleSelectClass}
                onBackToSubjects={() => setStep('subjects')}
              />
            </div>
            <div className="timetable-panel">
              <TimetableGrid
                selectedClasses={selectedArray}
                colorMap={colorMap}
                onRemoveClass={(classId) => {
                  setSelectedClasses(prev => {
                    const next = { ...prev };
                    const entry = Object.entries(next).find(([, v]) => v.id === classId);
                    if (entry) { delete next[entry[0]]; addNotif('Đã bỏ chọn lớp', 'info', 2000); }
                    return next;
                  });
                }}
              />
            </div>
          </div>
        )}
      </main>

      <input ref={importJsonRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportJSON} />
      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
      <Notification notifications={notifications} onDismiss={dismissNotif} />
    </div>
  );
}
