import { CLASS_COLORS } from './constants';

export function checkConflict(newClass, selectedClasses) {
  const conflicts = [];

  for (const selected of selectedClasses) {
    if (selected.id === newClass.id) continue;

    for (const newSlot of newClass.schedule) {
      for (const selSlot of selected.schedule) {
        if (newSlot.thu !== selSlot.thu) continue;

        const newStart = newSlot.tietBD;
        const newEnd = newSlot.tietBD + newSlot.soTiet - 1;
        const selStart = selSlot.tietBD;
        const selEnd = selSlot.tietBD + selSlot.soTiet - 1;

        if (newStart <= selEnd && newEnd >= selStart) {
          conflicts.push({
            conflictWith: selected,
            day: newSlot.thu,
            periods: `${newStart}-${newEnd}`,
          });
        }
      }
    }
  }

  return conflicts;
}

export function getColorForClass(classId, selectedClasses) {
  const idx = selectedClasses.findIndex(c => c.id === classId);
  if (idx === -1) return CLASS_COLORS[0];
  return CLASS_COLORS[idx % CLASS_COLORS.length];
}

export function buildTimetableMap(selectedClasses) {
  // Returns a map: { [day]: { [period]: { class, color, rowspan, isStart } } }
  const map = {};

  selectedClasses.forEach((cls, colorIdx) => {
    const color = CLASS_COLORS[colorIdx % CLASS_COLORS.length];
    cls.schedule.forEach(slot => {
      const day = slot.thu;
      if (!map[day]) map[day] = {};

      for (let p = slot.tietBD; p < slot.tietBD + slot.soTiet; p++) {
        map[day][p] = {
          class: cls,
          color,
          isStart: p === slot.tietBD,
          rowspan: slot.soTiet,
          slot,
        };
      }
    });
  });

  return map;
}

export function hasScheduleConflict(selectedClasses) {
  const slots = {};

  for (const cls of selectedClasses) {
    for (const slot of cls.schedule) {
      for (let p = slot.tietBD; p < slot.tietBD + slot.soTiet; p++) {
        const key = `${slot.thu}-${p}`;
        if (slots[key]) return true;
        slots[key] = cls.id;
      }
    }
  }

  return false;
}

export function groupClassesBySubject(classes) {
  const groups = {};
  classes.forEach(cls => {
    const key = cls.maHP;
    if (!groups[key]) {
      groups[key] = {
        maHP: cls.maHP,
        tenHP: cls.tenHP,
        soTC: cls.soTC,
        loaiHP: cls.loaiHP,
        sections: [],
      };
    }
    groups[key].sections.push(cls);
  });
  return Object.values(groups);
}
