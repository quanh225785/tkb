import React, { useState, useMemo, useCallback } from 'react';
import { Search, CheckSquare, Square, ChevronRight, BookOpen } from 'lucide-react';

export default function SubjectPicker({ allSubjects, initialSelected, onConfirm }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(() => new Set(initialSelected));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allSubjects;
    return allSubjects.filter(s =>
      s.maHP?.toLowerCase().includes(q) ||
      s.tenHP?.toLowerCase().includes(q) ||
      s.tenHPEn?.toLowerCase().includes(q)
    );
  }, [allSubjects, search]);

  const toggle = useCallback((maHP) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(maHP) ? next.delete(maHP) : next.add(maHP);
      return next;
    });
  }, []);

  const selectAll = () => setSelected(new Set(filtered.map(s => s.maHP)));
  const clearAll  = () => setSelected(new Set());

  const totalTC = useMemo(() => {
    return allSubjects
      .filter(s => selected.has(s.maHP))
      .reduce((sum, s) => sum + (parseFloat(s.soTC) || 0), 0);
  }, [allSubjects, selected]);

  return (
    <div className="subject-picker">
      {/* Top bar */}
      <div className="sp-topbar">
        <div className="sp-title">
          <span className="step-badge">Bước 1</span>
          <h2>Chọn môn học trong học kỳ</h2>
          <p>Chọn tất cả môn bạn muốn đăng ký, sau đó xếp lịch từng lớp</p>
        </div>
        <div className="sp-stats">
          <div className="stat-box">
            <span className="stat-num">{selected.size}</span>
            <span className="stat-label">Môn đã chọn</span>
          </div>
          <div className="stat-box">
            <span className="stat-num">{totalTC}</span>
            <span className="stat-label">Tín chỉ</span>
          </div>
          <div className="stat-box">
            <span className="stat-num">{allSubjects.length}</span>
            <span className="stat-label">Tổng môn</span>
          </div>
        </div>
      </div>

      {/* Search + actions */}
      <div className="sp-toolbar">
        <div className="sp-search-wrap">
          <Search size={16} className="sp-search-icon" />
          <input
            className="sp-search"
            placeholder="Tìm môn học theo tên hoặc mã HP..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="btn-sm" onClick={selectAll}>Chọn tất cả ({filtered.length})</button>
        <button className="btn-sm danger" onClick={clearAll}>Bỏ chọn hết</button>
      </div>

      {/* Subject list */}
      <div className="sp-list">
        {filtered.length === 0 && (
          <div className="sp-empty">Không tìm thấy môn học nào</div>
        )}
        {filtered.map(subject => {
          const isSelected = selected.has(subject.maHP);
          return (
            <button
              key={subject.maHP}
              className={`sp-item ${isSelected ? 'selected' : ''}`}
              onClick={() => toggle(subject.maHP)}
            >
              <span className="sp-check">
                {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
              </span>
              <div className="sp-item-info">
                <div className="sp-item-top">
                  <span className="sp-code">{subject.maHP}</span>
                  {subject.soTC && <span className="sp-tc">{subject.soTC} TC</span>}
                  {subject.loaiHP && (
                    <span className={`sp-type ${subject.loaiHP.includes('buộc') || subject.loaiHP.includes('BB') ? 'required' : 'elective'}`}>
                      {subject.loaiHP}
                    </span>
                  )}
                  <span className="sp-sections">{subject.sections.length} lớp</span>
                </div>
                <div className="sp-name">{subject.tenHP}</div>
                {subject.tenHPEn && <div className="sp-name-en">{subject.tenHPEn}</div>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Confirm button */}
      <div className="sp-footer">
        <div className="sp-footer-info">
          <BookOpen size={16} />
          <span>Đã chọn <strong>{selected.size}</strong> môn · <strong>{totalTC}</strong> tín chỉ</span>
        </div>
        <button
          className="btn-confirm"
          onClick={() => onConfirm(selected)}
          disabled={selected.size === 0}
        >
          Tiếp theo: Xếp lịch học
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
