/**
 * API service layer - gọi backend REST API
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ═══════════════════════════════════════════════
// Timetable APIs
// ═══════════════════════════════════════════════

/**
 * Upload file Excel lên server để parse
 */
export async function uploadExcel(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/timetable/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  const result = await response.json();
  if (!result.success) throw new Error(result.message);

  // data là JSON string, parse thành array
  return JSON.parse(result.data);
}

/**
 * Lưu TKB lên server
 */
export async function saveTimetable(data) {
  const result = await request('/timetable/save', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!result.success) throw new Error(result.message);
  return result.data;
}

/**
 * Cập nhật TKB
 */
export async function updateTimetable(id, data) {
  const result = await request(`/timetable/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!result.success) throw new Error(result.message);
  return result.data;
}

/**
 * Lấy danh sách TKB đã lưu
 */
export async function listTimetables() {
  const result = await request('/timetable/list');
  if (!result.success) throw new Error(result.message);
  return result.data;
}

/**
 * Lấy chi tiết 1 TKB
 */
export async function getTimetable(id) {
  const result = await request(`/timetable/${id}`);
  if (!result.success) throw new Error(result.message);
  return result.data;
}

/**
 * Xóa TKB
 */
export async function deleteTimetable(id) {
  const result = await request(`/timetable/${id}`, { method: 'DELETE' });
  if (!result.success) throw new Error(result.message);
  return result.data;
}

// ═══════════════════════════════════════════════
// Payment APIs
// ═══════════════════════════════════════════════

/**
 * Tạo link thanh toán PayOS
 * @param {Object} data - { description, amount, buyerName, buyerEmail, buyerPhone, timetableId }
 * @returns {{ orderCode, checkoutUrl, qrCode, status, amount, description }}
 */
export async function createPayment(data) {
  const result = await request('/payment/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!result.success) throw new Error(result.message);
  return result.data;
}

/**
 * Kiểm tra trạng thái thanh toán
 */
export async function getPaymentStatus(orderCode) {
  const result = await request(`/payment/${orderCode}`);
  if (!result.success) throw new Error(result.message);
  return result.data;
}

/**
 * Huỷ thanh toán
 */
export async function cancelPayment(orderCode, reason = 'Người dùng huỷ') {
  const result = await request(`/payment/${orderCode}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  if (!result.success) throw new Error(result.message);
  return result.data;
}

/**
 * Lấy lịch sử thanh toán
 */
export async function getPaymentHistory() {
  const result = await request('/payment/history');
  if (!result.success) throw new Error(result.message);
  return result.data;
}

// ═══════════════════════════════════════════════
// Health check
// ═══════════════════════════════════════════════

export async function healthCheck() {
  const result = await request('/health');
  return result.data;
}
