const STORAGE_KEY = 'tkb_selected_classes';
const STORAGE_META_KEY = 'tkb_meta';

export function saveToStorage(selectedClasses) {
  try {
    // selectedClasses là object {maHP: classObj}
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedClasses));
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
}

export function getStorageMeta() {
  try {
    const meta = localStorage.getItem(STORAGE_META_KEY);
    return meta ? JSON.parse(meta) : null;
  } catch (e) {
    return null;
  }
}
