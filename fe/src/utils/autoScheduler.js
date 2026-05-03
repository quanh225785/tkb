import { checkConflict } from './timetableUtils';

/**
 * Thuật toán Auto Scheduler sử dụng Backtracking
 * @param {Array} mySubjects - Mảng các môn học (mỗi môn có danh sách .sections)
 * @param {Object} options - { daysOff: [2, 3, 4, 5, 6, 7], pinnedClasses: { 'maHP': 'classId' } }
 * @returns {Array} Mảng các TKB hợp lệ đã được chấm điểm (score)
 */
export function generateSchedules(mySubjects, options = {}) {
  const { daysOff = [], pinnedClasses = {} } = options;
  const results = [];
  
  // 1. Lọc và tối ưu hoá dữ liệu đầu vào
  const filteredSubjects = mySubjects.map(sub => {
    // Nếu có lớp được ghim, ép buộc dùng lớp đó
    if (pinnedClasses[sub.maHP]) {
      return {
        ...sub,
        sections: sub.sections.filter(cls => cls.id === pinnedClasses[sub.maHP])
      };
    }
    
    // Bỏ qua các lớp học rơi vào ngày muốn nghỉ
    const validSections = sub.sections.filter(cls => {
      if (daysOff.length === 0) return true;
      return !cls.schedule.some(slot => daysOff.includes(slot.thu));
    });
    
    return { ...sub, sections: validSections };
  });

  // Nếu có môn không còn lớp nào -> Chắc chắn không thể xếp
  if (filteredSubjects.some(sub => sub.sections.length === 0)) {
    return [];
  }

  // Sắp xếp môn ít lựa chọn lên trước để "cắt tỉa" (prune) sớm cây tìm kiếm
  const sortedSubjects = [...filteredSubjects].sort((a, b) => a.sections.length - b.sections.length);

  // 2. Hàm đệ quy quay lui (Backtracking)
  function backtrack(subjectIndex, currentSchedule) {
    // Giới hạn số lượng kết quả (ví dụ 1000) để không làm treo trình duyệt
    if (results.length > 1000) return;

    // Đã chọn xong tất cả các môn
    if (subjectIndex === sortedSubjects.length) {
      results.push([...currentSchedule]);
      return;
    }

    const currentSubject = sortedSubjects[subjectIndex];
    
    // Thử ghép từng lớp của môn hiện tại
    for (const cls of currentSubject.sections) {
      if (checkConflict(cls, currentSchedule).length === 0) {
        currentSchedule.push(cls);
        backtrack(subjectIndex + 1, currentSchedule);
        currentSchedule.pop();
      }
    }
  }

  // Khởi động thuật toán
  backtrack(0, []);
  
  // 3. Chấm điểm và sắp xếp kết quả
  return rankSchedules(results);
}

/**
 * Chấm điểm TKB để đưa những cái "đẹp" lên đầu
 */
function rankSchedules(schedules) {
  return schedules.map(schedule => {
    let score = 0;
    const daysWithClasses = new Set();
    let gapPeriods = 0;

    const slotsByDay = { 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
    
    schedule.forEach(cls => {
      cls.schedule.forEach(slot => {
        daysWithClasses.add(slot.thu);
        slotsByDay[slot.thu].push({ start: slot.tietBD, end: slot.tietBD + slot.soTiet - 1 });
      });
    });

    // Điểm cộng: Ngày nghỉ càng nhiều -> Điểm càng cao
    score += (7 - daysWithClasses.size) * 20;

    // Tính lỗ hổng (gap) trong ngày
    Object.keys(slotsByDay).forEach(day => {
      const slots = slotsByDay[day];
      if (slots.length > 1) {
        slots.sort((a, b) => a.start - b.start);
        for (let i = 0; i < slots.length - 1; i++) {
          const gap = slots[i + 1].start - slots[i].end - 1;
          if (gap > 0) {
            gapPeriods += gap;
            // Thủng giờ càng dài trừ càng mạnh
            score -= (gap * 3);
          }
        }
      }
    });

    return { schedule, score, gapPeriods, daysWithClasses: daysWithClasses.size };
  }).sort((a, b) => b.score - a.score);
}
