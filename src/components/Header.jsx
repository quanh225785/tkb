import React from 'react';
import { Calendar, Download, Save, BookOpen, ArrowLeft } from 'lucide-react';

export default function Header({
  step, setStep, selectedCount, mySubjectsCount,
  onExport, onSave, onShowGuide, hasFile, fileName,
}) {
  return (
    <header className="header">
      <div className="header-inner">
        {/* Logo */}
        <div className="header-logo">
          <div className="logo-icon"><Calendar size={20} /></div>
          <div>
            <h1 className="logo-title">Xếp Lịch Học</h1>
            <p className="logo-subtitle">HUST TKB Planner</p>
          </div>
        </div>

        {/* Breadcrumb steps */}
        {hasFile && (
          <nav className="step-nav">
            <button
              className={`step-nav-item ${step === 'subjects' || step === 'upload' ? 'active' : ''}`}
              onClick={() => step === 'schedule' && setStep('subjects')}
            >
              <span className="step-num">1</span> Chọn môn
            </button>
            <span className="step-arrow">›</span>
            <button
              className={`step-nav-item ${step === 'schedule' ? 'active' : ''}`}
              disabled={mySubjectsCount === 0}
              onClick={() => mySubjectsCount > 0 && setStep('schedule')}
            >
              <span className="step-num">2</span> Xếp lịch
              {mySubjectsCount > 0 && <span className="badge">{mySubjectsCount}</span>}
            </button>
          </nav>
        )}

        {/* Right actions */}
        <div className="header-actions">
          {fileName && (
            <span className="filename-chip" title={fileName}>
              📄 {fileName.length > 20 ? fileName.slice(0, 20) + '…' : fileName}
            </span>
          )}
          {selectedCount > 0 && (
            <>
              <button className="action-btn success" onClick={onExport}>
                <Download size={14} /><span>Xuất Excel</span>
              </button>
              <button className="action-btn" onClick={onSave}>
                <Save size={14} /><span>Lưu</span>
              </button>
            </>
          )}
          <button className="action-btn guide-btn" onClick={onShowGuide}>
            <BookOpen size={14} /><span>Hướng dẫn</span>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {step === 'schedule' && selectedCount > 0 && (
        <div className="header-progress">
          <div
            className="header-progress-fill"
            style={{ width: `${mySubjectsCount ? (selectedCount / mySubjectsCount) * 100 : 0}%` }}
          />
        </div>
      )}
    </header>
  );
}
