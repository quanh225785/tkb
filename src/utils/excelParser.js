import * as XLSX from 'xlsx';

// Normalize: bỏ dấu, lowercase, đổi _ thành space
function norm(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .toLowerCase()
    .replace(/_/g, ' ')        // <-- FIX: gạch dưới → space
    .replace(/đ/g, 'd').replace(/Đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Map tên cột → field
function detectField(rawHeader) {
  const n = norm(rawHeader);
  if (n === 'ma hp')                              return 'maHP';
  if (n === 'ma lop' || n === 'ma lop kem')       return 'maLop';
  if (n === 'ky' || n === 'ky hoc')               return 'ky';
  if (n.startsWith('ten hp tieng anh'))            return 'tenHPEn';
  if (n === 'ten hp' || n === 'ten mon hoc')       return 'tenHP';
  if (n === 'loai hp')                             return 'loaiHP';
  if (n === 'so tc' || n === 'sotc')               return 'soTC';
  if (n === 'khoi luong')                          return 'khoiLuong';
  if (n === 'thu')                                 return 'thu';
  if (n === 'tiet bd' || n === 'tiet bat dau')     return 'tietBD';
  if (n === 'so tiet')                             return 'soTiet';
  if (n === 'phong')                               return 'phong';
  if (n === 'buoi' || n === 'buoi so')             return 'buoiSo';
  if (n === 'thoi gian')                           return 'thoiGian';
  if (n === 'tuan hoc' || n === 'tuan')            return 'tuanHoc';
  if (n.includes('giang vien') || n === 'gv')      return 'giangVien';
  if (n.includes('ghi chu'))                       return 'ghiChu';
  if (n.includes('truong vien') || n === 'truong') return 'truong';
  if (n.includes('cn dao tao') || n.includes('chuong trinh')) return 'cnDaoTao';
  if (n.includes('trang thai'))                    return 'trangThai';
  if (n === 'si so' || n === 'sl/dc' || n === 'lp') return 'siSo';
  return null;
}

function findHeaderRow(rows) {
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const row = rows[i];
    if (!row) continue;
    let hasHP = false, hasLop = false, hasSched = false;
    for (const cell of row) {
      const n = norm(cell);
      if (n === 'ma hp')              hasHP   = true;
      if (n === 'ma lop')             hasLop  = true;
      if (n === 'thu' || n === 'tiet bd' || n === 'thoi gian') hasSched = true;
    }
    if ((hasHP || hasLop) && hasSched) return i;
    if (hasHP && hasLop)               return i;
  }
  return -1;
}

function buildColMap(headerRow) {
  const colMap = {};
  headerRow.forEach((cell, idx) => {
    const field = detectField(cell);
    if (field && !(field in colMap)) colMap[field] = idx;
  });
  return colMap;
}

function val(row, idx) {
  if (idx === undefined || idx === null) return '';
  const v = row[idx];
  return (v === undefined || v === null) ? '' : String(v).trim();
}

// Chuyển giờ "HHMM" → tiết học HUST
const TIME_TO_PERIOD = [
  [645,  1], [740,  2], [835,  3], [930,  4],
  [1025, 5], [1120, 6], [1230, 7], [1325, 8],
  [1420, 9], [1515,10], [1610,11], [1705,12],
  [1800,13], [1855,14], [1950,15], [2045,16],
];

function timeToPeriod(hhmm) {
  const t = parseInt(String(hhmm).replace(':', ''));
  if (isNaN(t)) return null;
  let best = null, bestDiff = 9999;
  for (const [time, period] of TIME_TO_PERIOD) {
    const diff = Math.abs(t - time);
    if (diff < bestDiff) { bestDiff = diff; best = period; }
  }
  return best;
}

// Parse "0645-0910" hoặc "06:45-09:10" → { tietBD, soTiet }
function parseThoiGian(thoiGian) {
  if (!thoiGian) return null;
  const match = String(thoiGian).match(/(\d{3,4})\s*[-–]\s*(\d{3,4})/);
  if (!match) return null;
  const start = timeToPeriod(match[1]);
  const end   = timeToPeriod(match[2]);
  if (!start) return null;
  const soTiet = end ? Math.max(1, end - start + 1) : 1;
  return { tietBD: start, soTiet };
}

function getSessionFromPeriod(p) {
  const n = parseInt(p);
  if (n >= 1  && n <= 6)  return 'S';
  if (n >= 7  && n <= 12) return 'C';
  if (n >= 13 && n <= 16) return 'T';
  return '';
}

export async function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', raw: false });
        const debugLines = [`Sheets: [${workbook.SheetNames.join(', ')}]`];
        let allClasses = [];

        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, {
            header: 1, defval: '', raw: false, blankrows: false,
          });

          debugLines.push(`\nSheet "${sheetName}": ${rows.length} dòng`);
          for (let i = 0; i < Math.min(4, rows.length); i++) {
            debugLines.push(`  [${i}] ${JSON.stringify(rows[i])}`);
          }

          const headerIdx = findHeaderRow(rows);
          debugLines.push(`  headerIdx=${headerIdx}`);
          if (headerIdx === -1) { debugLines.push('  ✗ không tìm thấy header'); continue; }

          const colMap = buildColMap(rows[headerIdx]);
          debugLines.push(`  colMap=${JSON.stringify(colMap)}`);

          if (colMap.maHP === undefined && colMap.maLop === undefined) {
            debugLines.push('  ✗ thiếu cột Mã HP / Mã lớp'); continue;
          }

          const classes = [], classMap = {};
          const CARRY = ['maHP','maLop','tenHP','tenHPEn','loaiHP','soTC',
                         'khoiLuong','cnDaoTao','giangVien','trangThai',
                         'truong','siSo','tuanHoc','ghiChu'];
          const last = Object.fromEntries(CARRY.map(f => [f, '']));

          for (let i = headerIdx + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.every(c => !c || String(c).trim() === '')) continue;

            const cur = {};
            for (const f of CARRY) {
              const v = val(row, colMap[f]);
              cur[f] = v || last[f];
              if (v) last[f] = v;
            }

            // Schedule
            const thu      = val(row, colMap.thu);
            const thoiGian = val(row, colMap.thoiGian);
            const phong    = val(row, colMap.phong);
            const tuan     = cur.tuanHoc;

            // Tiết từ cột rõ ràng hoặc parse từ Thời_gian
            let tietBD = parseInt(val(row, colMap.tietBD)) || 0;
            let soTiet = parseInt(val(row, colMap.soTiet)) || 0;
            if ((!tietBD || !soTiet) && thoiGian) {
              const parsed = parseThoiGian(thoiGian);
              if (parsed) { tietBD = parsed.tietBD; soTiet = parsed.soTiet; }
            }

            // Nếu không có maLop, thử dùng ghiChu hoặc maHP làm key phụ
            const maLopEff = cur.maLop || cur.ghiChu || cur.maHP;
            if (!cur.maHP && !maLopEff) continue;

            const classKey = `${cur.maHP}__${maLopEff}`;
            if (!classMap[classKey]) {
              classMap[classKey] = {
                id: classKey,
                maHP: cur.maHP, maLop: maLopEff,
                tenHP: cur.tenHP || cur.maHP,
                tenHPEn: cur.tenHPEn, loaiHP: cur.loaiHP,
                soTC: cur.soTC, khoiLuong: cur.khoiLuong,
                cnDaoTao: cur.cnDaoTao || cur.ghiChu,
                giangVien: cur.giangVien,
                trangThai: cur.trangThai, truong: cur.truong,
                siSo: cur.siSo, schedule: [],
              };
              classes.push(classMap[classKey]);
            } else {
              const cls = classMap[classKey];
              if (!cls.tenHP     && cur.tenHP)     cls.tenHP     = cur.tenHP;
              if (!cls.giangVien && cur.giangVien) cls.giangVien = cur.giangVien;
              if (!cls.cnDaoTao  && cur.cnDaoTao)  cls.cnDaoTao  = cur.cnDaoTao;
              if (!cls.soTC      && cur.soTC)       cls.soTC      = cur.soTC;
            }

            const thuNum = parseInt(thu);
            if (thuNum >= 2 && thuNum <= 8 && tietBD >= 1) {
              classMap[classKey].schedule.push({
                thu: thuNum, tietBD, soTiet: soTiet || 1,
                phong, buoi: getSessionFromPeriod(tietBD),
                tuanHoc: tuan || '',
              });
            }
          }

          debugLines.push(`  ✓ ${classes.length} lớp`);
          if (classes.length > 0) { allClasses = classes; break; }
        }

        console.group('[TKB Parser]');
        debugLines.forEach(l => console.log(l));
        console.groupEnd();

        if (allClasses.length === 0) {
          reject(new Error('Không đọc được dữ liệu.\n\nDEBUG LOG:\n' + debugLines.join('\n')));
          return;
        }
        resolve(allClasses);
      } catch (err) {
        console.error('[TKB Parser]', err);
        reject(new Error('Lỗi: ' + err.message));
      }
    };

    reader.onerror = () => reject(new Error('Không thể đọc file'));
    reader.readAsArrayBuffer(file);
  });
}
