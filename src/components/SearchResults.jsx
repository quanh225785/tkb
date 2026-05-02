import React, { useState } from 'react';
import { CheckCircle, Clock, MapPin, User, ChevronDown, ChevronUp, Plus, Check, AlertTriangle } from 'lucide-react';
import { DAYS } from '../utils/constants';

function ScheduleTag({ slot }) {
  const dayLabel = DAYS.find(d => d.id === slot.thu)?.short || `T${slot.thu}`;
  const endPeriod = slot.tietBD + slot.soTiet - 1;
  return (
    <span className="schedule-tag">
      <Clock size={11} />
      {dayLabel} · Tiết {slot.tietBD}–{endPeriod}
      {slot.phong && (
        <><MapPin size={11} />{slot.phong}</>
      )}
    </span>
  );
}

function ClassCard({ cls, onAdd, isSelected, hasConflict, colorStyle }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`class-card ${isSelected ? 'selected' : ''} ${hasConflict ? 'conflict' : ''}`}
      style={isSelected ? { borderColor: colorStyle?.bg, background: colorStyle?.light } : {}}
    >
      <div className="class-card-header">
        <div className="class-card-info">
          <div className="class-id-row">
            <span className="class-badge">{cls.maLop || cls.maHP}</span>
            {cls.loaiHP && (
              <span className={`type-badge ${cls.loaiHP.includes('bắt buộc') || cls.loaiHP.includes('BB') ? 'required' : 'elective'}`}>
                {cls.loaiHP}
              </span>
            )}
            {isSelected && <span className="selected-badge"><Check size={11} /> Đã chọn</span>}
            {hasConflict && <span className="conflict-badge"><AlertTriangle size={11} /> Trùng lịch</span>}
          </div>
          <div className="schedule-tags">
            {cls.schedule.slice(0, expanded ? undefined : 2).map((slot, i) => (
              <ScheduleTag key={i} slot={slot} />
            ))}
            {!expanded && cls.schedule.length > 2 && (
              <span className="more-tag">+{cls.schedule.length - 2} khác</span>
            )}
          </div>
        </div>

        <button
          id={`btn-add-${cls.id}`}
          className={`btn-add-class ${isSelected ? 'selected' : ''} ${hasConflict ? 'conflict' : ''}`}
          onClick={() => onAdd(cls)}
          title={isSelected ? 'Bỏ chọn lớp này' : 'Thêm vào TKB'}
        >
          {isSelected ? <Check size={18} /> : hasConflict ? <AlertTriangle size={18} /> : <Plus size={18} />}
        </button>
      </div>

      <div className="class-card-meta">
        {cls.giangVien && (
          <span className="meta-item">
            <User size={13} />
            {cls.giangVien}
          </span>
        )}
        {cls.cnDaoTao && (
          <span className="meta-item program">
            {cls.cnDaoTao}
          </span>
        )}
        {cls.schedule.some(s => s.tuanHoc) && (
          <span className="meta-item">
            <Clock size={13} />
            Tuần: {cls.schedule.find(s => s.tuanHoc)?.tuanHoc}
          </span>
        )}
      </div>

      {cls.schedule.length > 2 && (
        <button
          className="expand-btn"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <><ChevronUp size={13} /> Thu gọn</> : <><ChevronDown size={13} /> Xem thêm lịch</>}
        </button>
      )}
    </div>
  );
}

export default function SearchResults({ results, selectedClasses, onToggleClass, getConflicts, getColor }) {
  const [expandedSubjects, setExpandedSubjects] = useState({});

  if (!results || results.length === 0) return null;

  // Group by course code
  const groups = {};
  results.forEach(cls => {
    const key = cls.maHP || cls.tenHP;
    if (!groups[key]) {
      groups[key] = { maHP: cls.maHP, tenHP: cls.tenHP, soTC: cls.soTC, loaiHP: cls.loaiHP, sections: [] };
    }
    groups[key].sections.push(cls);
  });

  const groupList = Object.values(groups);

  const toggleSubject = (key) => {
    setExpandedSubjects(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="search-results">
      <div className="results-header">
        <h3 className="results-title">
          Kết quả tìm kiếm
          <span className="results-count">{results.length} lớp / {groupList.length} môn</span>
        </h3>
      </div>

      <div className="results-list">
        {groupList.map((group) => {
          const isOpen = expandedSubjects[group.maHP] !== false; // default open
          const selectedInGroup = group.sections.filter(c =>
            selectedClasses.some(s => s.id === c.id)
          ).length;

          return (
            <div key={group.maHP} className="subject-group">
              <button
                id={`subject-${group.maHP}`}
                className="subject-header"
                onClick={() => toggleSubject(group.maHP)}
              >
                <div className="subject-info">
                  <span className="subject-code">{group.maHP}</span>
                  <span className="subject-name">{group.tenHP}</span>
                  <div className="subject-badges">
                    {group.soTC && <span className="tc-badge">{group.soTC} TC</span>}
                    <span className="section-count">{group.sections.length} lớp</span>
                    {selectedInGroup > 0 && (
                      <span className="selected-count">✓ {selectedInGroup} đã chọn</span>
                    )}
                  </div>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {isOpen && (
                <div className="section-list">
                  {group.sections.map((cls) => {
                    const isSelected = selectedClasses.some(s => s.id === cls.id);
                    const conflicts = isSelected ? [] : getConflicts(cls);
                    const hasConflict = conflicts.length > 0;
                    const colorStyle = isSelected ? getColor(cls.id) : null;

                    return (
                      <ClassCard
                        key={cls.id}
                        cls={cls}
                        onAdd={onToggleClass}
                        isSelected={isSelected}
                        hasConflict={hasConflict}
                        colorStyle={colorStyle}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
