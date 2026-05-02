import React, { useState, useMemo } from 'react';
import { ArrowLeft, Clock, MapPin, User, Check, AlertTriangle, ChevronRight } from 'lucide-react';
import { DAYS } from '../utils/constants';
import { checkConflict } from '../utils/timetableUtils';

function ScheduleTag({ slot }) {
  const dayLabel = DAYS.find(d => d.id === slot.thu)?.short || `T${slot.thu}`;
  const end = slot.tietBD + slot.soTiet - 1;
  return (
    <span className="sched-tag">
      <Clock size={10} />
      {dayLabel} · {slot.tietBD}–{end}
      {slot.phong && <><MapPin size={10} />{slot.phong}</>}
    </span>
  );
}

export default function ClassPicker({ mySubjects, selectedClasses, colorMap, onSelectClass, onBackToSubjects }) {
  const [activeIdx, setActiveIdx] = useState(0);

  const selectedArray = useMemo(() => Object.values(selectedClasses), [selectedClasses]);
  const doneCount  = Object.keys(selectedClasses).length;
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
          <span style={{ fontWeight: 600, color: doneCount === totalCount ? 'var(--green)' : 'var(--text2)' }}>
            {doneCount}/{totalCount}
          </span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${totalCount ? (doneCount / totalCount) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* ── BODY: 2 columns inside picker ── */}
      <div className="cp-body">

        {/* LEFT: subject tab list */}
        <div className="cp-subject-tabs">
          {mySubjects.map((subject, idx) => {
            const chosen = selectedClasses[subject.maHP];
            const color  = chosen ? colorMap[chosen.id]?.bg : null;
            const isActive = idx === activeIdx;
            return (
              <button
                key={subject.maHP}
                className={`cp-tab ${isActive ? 'active' : ''} ${chosen ? 'done' : ''}`}
                onClick={() => setActiveIdx(idx)}
              >
                {/* Color dot */}
                <span
                  className="cp-tab-dot"
                  style={{ background: chosen ? color : 'var(--bg4)' }}
                />
                <div className="cp-tab-info">
                  <span className="cp-tab-code">{subject.maHP}</span>
                  <span className="cp-tab-name">{subject.tenHP}</span>
                  {chosen && (
                    <span className="cp-tab-chosen" style={{ color }}>
                      <Check size={9} /> {chosen.maLop}
                    </span>
                  )}
                </div>
                {subject.soTC && <span className="cp-tab-tc">{subject.soTC}TC</span>}
                <ChevronRight size={12} className="cp-tab-arrow" />
              </button>
            );
          })}
        </div>

        {/* RIGHT: class list for active subject */}
        <div className="cp-class-list">
          {activeSubject && (
            <>
              <div className="cp-class-header">
                <div>
                  <div className="cp-class-code">{activeSubject.maHP}</div>
                  <div className="cp-class-name">{activeSubject.tenHP}</div>
                  {activeSubject.tenHPEn && <div className="cp-class-name-en">{activeSubject.tenHPEn}</div>}
                </div>
                <div className="cp-class-meta">
                  {activeSubject.soTC && <span className="tc-pill">{activeSubject.soTC} TC</span>}
                  <span className="secs-pill">{activeSubject.sections.length} lớp</span>
                </div>
              </div>

              <div className="cp-cards-scroll">
                {activeSubject.sections.map(cls => {
                  const isSelected = selectedClasses[activeSubject.maHP]?.id === cls.id;
                  const conflicts  = !isSelected ? checkConflict(cls, selectedArray) : [];
                  const hasConflict = conflicts.length > 0;
                  const color = isSelected ? colorMap[cls.id]?.bg : null;

                  return (
                    <button
                      key={cls.id}
                      className={`cc-card ${isSelected ? 'selected' : ''} ${hasConflict && !isSelected ? 'conflict' : ''}`}
                      style={isSelected ? { borderColor: color, background: `${color}18` } : {}}
                      onClick={() => onSelectClass(cls)}
                    >
                      {/* Left: info */}
                      <div className="cc-left">
                        <div className="cc-top">
                          <span className="cc-lop">{cls.maLop}</span>
                          {isSelected && (
                            <span className="cc-badge selected-b"><Check size={9} /> Đã chọn</span>
                          )}
                          {hasConflict && !isSelected && (
                            <span className="cc-badge conflict-b"><AlertTriangle size={9} /> Trùng lịch</span>
                          )}
                        </div>

                        {/* Schedule */}
                        <div className="cc-sched">
                          {cls.schedule.map((s, i) => <ScheduleTag key={i} slot={s} />)}
                        </div>

                        {/* Meta */}
                        <div className="cc-meta">
                          {cls.giangVien && (
                            <span><User size={10} />{cls.giangVien}</span>
                          )}
                          {cls.cnDaoTao && (
                            <span className="cn">{cls.cnDaoTao}</span>
                          )}
                          {conflicts.length > 0 && !isSelected && (
                            <span style={{ color: 'var(--amber)' }}>
                              Trùng: {conflicts.map(c => c.conflictWith.tenHP).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: select button */}
                      <div
                        className="cc-select-btn"
                        style={isSelected ? { background: color, borderColor: color, color: '#fff' } : {}}
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
