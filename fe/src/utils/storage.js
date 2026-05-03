const STORAGE_KEY = 'tkb_selected_classes';
const STORAGE_META_KEY = 'tkb_meta';
const STORAGE_ALL_CLASSES_KEY = 'tkb_all_classes';
const STORAGE_SUBJECTS_KEY = 'tkb_subject_codes';

export function saveToStorage(selectedClasses, allClasses, mySubjectCodes) {
  try {
    // selectedClasses là object {maHP: classObj}
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedClasses));
    // Lưu thêm allClasses và mySubjectCodes để restore đầy đủ
    if (allClasses && allClasses.length > 0) {
      localStorage.setItem(STORAGE_ALL_CLASSES_KEY, JSON.stringify(allClasses));
    }
    if (mySubjectCodes && mySubjectCodes.size > 0) {
      localStorage.setItem(STORAGE_SUBJECTS_KEY, JSON.stringify([...mySubjectCodes]));
    }
    localStorage.setItem(STORAGE_META_KEY, JSON.stringify({
      savedAt: new Date().toISOString(),
      count: Object.keys(selectedClasses).length,
    }));
    return true;
  } catch (e) {
    console.error('Save failed:', e);
    return false;
  }
}

export function loadFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    // Support cả array (dữ liệu cũ) lẫn object (mới)
    if (Array.isArray(parsed)) {
      return Object.fromEntries(parsed.map(c => [c.maHP, c]));
    }
    return parsed; // object {maHP: classObj}
  } catch (e) {
    return null;
  }
}

export function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_META_KEY);
  localStorage.removeItem(STORAGE_ALL_CLASSES_KEY);
  localStorage.removeItem(STORAGE_SUBJECTS_KEY);
}

export function loadAllClassesFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_ALL_CLASSES_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

export function loadSubjectCodesFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_SUBJECTS_KEY);
    return data ? new Set(JSON.parse(data)) : null;
  } catch (e) {
    return null;
  }
}

export function getStorageMeta() {
  try {
    const meta = localStorage.getItem(STORAGE_META_KEY);
    return meta ? JSON.parse(meta) : null;
  } catch (e) {
    return null;
  }
}
