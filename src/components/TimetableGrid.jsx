import React, { useMemo } from 'react';
import { X, MapPin, User } from 'lucide-react';
import { DAYS, TIME_SLOTS } from '../utils/constants';
import { buildTimetableMap } from '../utils/timetableUtils';

const SESSION_GROUPS = [
  { label: 'Sáng',  periods: [1,2,3,4,5,6],     color: '#f59e0b' },
  { label: 'Chiều', periods: [7,8,9,10,11,12],   color: '#3b82f6' },
  { label: 'Tối',   periods: [13,14,15,16],       color: '#8b5cf6' },
];

const COLORS = ['#4f8ef7','#22c55e','#a78bfa','#fbbf24','#f87171',
                '#f472b6','#22d3ee','#84cc16','#f97316','#6366f1','#14b8a6','#d946ef'];

export default function TimetableGrid({ selectedClasses, colorMap, onRemoveClass }) {
  const timetableMap = useMemo(() => buildTimetableMap(selectedClasses), [selectedClasses]);

  if (selectedClasses.length === 0) {
    return (
      <div className="tkb-wrap">
        <div className="tkb-empty">
          <div style={{ fontSize: 40 }}>📅</div>
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
                {DAYS.map(d => <th key={d.id} className="th-day">{d.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {SESSION_GROUPS.map(sg =>
                sg.periods.map((p, pi) => {
                  const ts = TIME_SLOTS.find(t => t.period === p);
                  return (
                    <tr key={p} className={pi === 0 ? 'session-start' : ''}>
                      {pi === 0 && (
                        <td className="td-session" rowSpan={sg.periods.length} style={{ borderLeftColor: sg.color }}>
                          <span className="session-label" style={{ color: sg.color }}>{sg.label}</span>
                        </td>
                      )}
                      <td className="td-period">{p}</td>
                      <td className="td-time">{ts?.time}</td>
                      {DAYS.map(d => <td key={d.id} className="td-class empty" />)}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="tkb-wrap">
      {/* Legend */}
      <div className="tkb-legend">
        {selectedClasses.map((cls, idx) => {
          const color = colorMap?.[cls.id]?.bg || COLORS[idx % 12];
          return (
            <div key={cls.id} className="leg-item">
              <span className="leg-dot" style={{ background: color }} />
              <span className="leg-text">{cls.tenHP} · {cls.maLop}</span>
              {onRemoveClass && (
                <button className="leg-rm" onClick={() => onRemoveClass(cls.id)}>
                  <X size={11} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <div className="timetable-scroll">
        <table className="timetable-table">
          <thead>
            <tr>
              <th className="th-session" />
              <th className="th-period">Tiết</th>
              <th className="th-time">Giờ</th>
              {DAYS.map(d => <th key={d.id} className="th-day">{d.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {SESSION_GROUPS.map(sg =>
              sg.periods.map((period, pi) => {
                const ts = TIME_SLOTS.find(t => t.period === period);
                return (
                  <tr key={period} className={pi === 0 ? 'session-start' : ''}>
                    {pi === 0 && (
                      <td className="td-session" rowSpan={sg.periods.length} style={{ borderLeftColor: sg.color }}>
                        <span className="session-label" style={{ color: sg.color }}>{sg.label}</span>
                      </td>
                    )}
                    <td className="td-period">{period}</td>
                    <td className="td-time">{ts?.time}</td>

                    {DAYS.map(day => {
                      const cell = timetableMap[day.id]?.[period];
                      if (!cell) return <td key={day.id} className="td-class empty" />;
                      if (!cell.isStart) return null;

                      const idx   = selectedClasses.findIndex(c => c.id === cell.class.id);
                      const color = colorMap?.[cell.class.id]?.bg || COLORS[idx % 12];

                      return (
                        <td
                          key={day.id}
                          className="td-class filled"
                          rowSpan={cell.rowspan}
                          style={{ background: `${color}22`, borderLeft: `3px solid ${color}` }}
                        >
                          <div className="cell-inner">
                            <div className="cell-name" style={{ color }}>{cell.class.tenHP}</div>
                            <div className="cell-code">{cell.class.maLop}</div>
                            {cell.slot?.phong && (
                              <div className="cell-room">
                                <MapPin size={9} />{cell.slot.phong}
                              </div>
                            )}
                            {cell.class.giangVien && (
                              <div className="cell-lect">
                                <User size={9} />{cell.class.giangVien}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
