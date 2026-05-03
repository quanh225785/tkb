package com.hust.tkb.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.*;

@Service
public class ExcelParserService {

    private final ObjectMapper mapper = new ObjectMapper();

    // Normalize: bỏ dấu, lowercase, đổi _ thành space (port từ JS)
    private String norm(String str) {
        if (str == null) return "";
        return str.toLowerCase()
                .replace("_", " ")
                .replace("đ", "d").replace("Đ", "d")
                .replaceAll("[\\u0300-\\u036f]", "")
                .replaceAll("\\s+", " ")
                .trim();
    }

    // Normalize Unicode NFD (bỏ dấu tiếng Việt)
    private String removeVietnameseAccents(String str) {
        if (str == null) return "";
        String normalized = java.text.Normalizer.normalize(str, java.text.Normalizer.Form.NFD);
        return normalized.replaceAll("[\\p{InCombiningDiacriticalMarks}]", "");
    }

    private String detectField(String rawHeader) {
        String n = norm(removeVietnameseAccents(rawHeader));
        if (n.equals("ma hp")) return "maHP";
        if (n.equals("ma lop") || n.equals("ma lop kem")) return "maLop";
        if (n.equals("ky") || n.equals("ky hoc")) return "ky";
        if (n.startsWith("ten hp tieng anh")) return "tenHPEn";
        if (n.equals("ten hp") || n.equals("ten mon hoc")) return "tenHP";
        if (n.equals("loai hp")) return "loaiHP";
        if (n.equals("so tc") || n.equals("sotc")) return "soTC";
        if (n.equals("khoi luong")) return "khoiLuong";
        if (n.equals("thu")) return "thu";
        if (n.equals("tiet bd") || n.equals("tiet bat dau")) return "tietBD";
        if (n.equals("so tiet")) return "soTiet";
        if (n.equals("phong")) return "phong";
        if (n.equals("buoi") || n.equals("buoi so")) return "buoiSo";
        if (n.equals("thoi gian")) return "thoiGian";
        if (n.equals("tuan hoc") || n.equals("tuan")) return "tuanHoc";
        if (n.contains("giang vien") || n.equals("gv")) return "giangVien";
        if (n.contains("ghi chu")) return "ghiChu";
        if (n.contains("truong vien") || n.equals("truong")) return "truong";
        if (n.contains("cn dao tao") || n.contains("chuong trinh")) return "cnDaoTao";
        if (n.contains("trang thai")) return "trangThai";
        if (n.equals("si so") || n.equals("sl/dc") || n.equals("lp")) return "siSo";
        return null;
    }

    private static final int[][] TIME_TO_PERIOD = {
            {645, 1}, {730, 2}, {825, 3}, {920, 4}, {1015, 5}, {1100, 6},
            {1230, 7}, {1315, 8}, {1410, 9}, {1505, 10}, {1600, 11}, {1645, 12}
    };

    private Integer timeToPeriod(String hhmm) {
        try {
            int t = Integer.parseInt(hhmm.replace(":", ""));
            int best = -1;
            int bestDiff = 9999;
            for (int[] pair : TIME_TO_PERIOD) {
                int diff = Math.abs(t - pair[0]);
                if (diff < bestDiff) {
                    bestDiff = diff;
                    best = pair[1];
                }
            }
            return best > 0 ? best : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private int[] parseThoiGian(String thoiGian) {
        if (thoiGian == null || thoiGian.isEmpty()) return null;
        // Match pattern like "0645-0910" or "06:45-09:10"
        String cleaned = thoiGian.replaceAll(":", "");
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("(\\d{3,4})\\s*[-–]\\s*(\\d{3,4})").matcher(cleaned);
        if (!m.find()) return null;
        Integer start = timeToPeriod(m.group(1));
        Integer end = timeToPeriod(m.group(2));
        if (start == null) return null;
        int soTiet = (end != null) ? Math.max(1, end - start + 1) : 1;
        return new int[]{start, soTiet};
    }

    private String getSessionFromPeriod(int p) {
        if (p >= 1 && p <= 6) return "S";
        if (p >= 7 && p <= 12) return "C";
        return "";
    }

    private String getCellValue(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                double d = cell.getNumericCellValue();
                if (d == Math.floor(d) && !Double.isInfinite(d)) {
                    yield String.valueOf((long) d);
                }
                yield String.valueOf(d);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> {
                try {
                    yield cell.getStringCellValue().trim();
                } catch (Exception e) {
                    try {
                        yield String.valueOf(cell.getNumericCellValue());
                    } catch (Exception e2) {
                        yield "";
                    }
                }
            }
            default -> "";
        };
    }

    /**
     * Parse file Excel TKB → JSON array chứa tất cả các lớp
     */
    public String parseExcel(MultipartFile file) throws Exception {
        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            ArrayNode allClasses = mapper.createArrayNode();

            for (int sheetIdx = 0; sheetIdx < workbook.getNumberOfSheets(); sheetIdx++) {
                Sheet sheet = workbook.getSheetAt(sheetIdx);
                List<List<String>> rows = new ArrayList<>();

                for (Row row : sheet) {
                    List<String> cells = new ArrayList<>();
                    int lastCol = row.getLastCellNum();
                    for (int c = 0; c < lastCol; c++) {
                        cells.add(getCellValue(row.getCell(c)));
                    }
                    rows.add(cells);
                }

                if (rows.isEmpty()) continue;

                // Find header row
                int headerIdx = findHeaderRow(rows);
                if (headerIdx == -1) continue;

                // Build column map
                Map<String, Integer> colMap = buildColMap(rows.get(headerIdx));
                if (!colMap.containsKey("maHP") && !colMap.containsKey("maLop")) continue;

                // Parse data rows
                ArrayNode classes = parseDataRows(rows, headerIdx, colMap);
                if (classes.size() > 0) {
                    allClasses = classes;
                    break;
                }
            }

            if (allClasses.size() == 0) {
                throw new RuntimeException("Không đọc được dữ liệu từ file Excel");
            }

            return mapper.writeValueAsString(allClasses);
        }
    }

    private int findHeaderRow(List<List<String>> rows) {
        for (int i = 0; i < Math.min(15, rows.size()); i++) {
            List<String> row = rows.get(i);
            boolean hasHP = false, hasLop = false, hasSched = false;
            for (String cell : row) {
                String n = norm(removeVietnameseAccents(cell));
                if (n.equals("ma hp")) hasHP = true;
                if (n.equals("ma lop")) hasLop = true;
                if (n.equals("thu") || n.equals("tiet bd") || n.equals("thoi gian")) hasSched = true;
            }
            if ((hasHP || hasLop) && hasSched) return i;
            if (hasHP && hasLop) return i;
        }
        return -1;
    }

    private Map<String, Integer> buildColMap(List<String> headerRow) {
        Map<String, Integer> colMap = new LinkedHashMap<>();
        for (int i = 0; i < headerRow.size(); i++) {
            String field = detectField(headerRow.get(i));
            if (field != null && !colMap.containsKey(field)) {
                colMap.put(field, i);
            }
        }
        return colMap;
    }

    private String val(List<String> row, Integer idx) {
        if (idx == null || idx >= row.size()) return "";
        String v = row.get(idx);
        return v == null ? "" : v.trim();
    }

    private ArrayNode parseDataRows(List<List<String>> rows, int headerIdx, Map<String, Integer> colMap) {
        ArrayNode classes = mapper.createArrayNode();
        Map<String, ObjectNode> classMap = new LinkedHashMap<>();

        String[] CARRY = {"maHP", "maLop", "tenHP", "tenHPEn", "loaiHP", "soTC",
                "khoiLuong", "cnDaoTao", "giangVien", "trangThai", "truong", "siSo", "tuanHoc", "ghiChu"};

        Map<String, String> last = new HashMap<>();
        for (String f : CARRY) last.put(f, "");

        for (int i = headerIdx + 1; i < rows.size(); i++) {
            List<String> row = rows.get(i);
            if (row.stream().allMatch(c -> c == null || c.trim().isEmpty())) continue;

            Map<String, String> cur = new HashMap<>();
            for (String f : CARRY) {
                String v = val(row, colMap.get(f));
                cur.put(f, !v.isEmpty() ? v : last.get(f));
                if (!v.isEmpty()) last.put(f, v);
            }

            String thu = val(row, colMap.get("thu"));
            String thoiGian = val(row, colMap.get("thoiGian"));
            String phong = val(row, colMap.get("phong"));
            String tuan = cur.get("tuanHoc");

            int tietBD = 0, soTiet = 0;
            try {
                tietBD = Integer.parseInt(val(row, colMap.get("tietBD")));
            } catch (NumberFormatException ignored) {}
            try {
                soTiet = Integer.parseInt(val(row, colMap.get("soTiet")));
            } catch (NumberFormatException ignored) {}

            if ((tietBD == 0 || soTiet == 0) && !thoiGian.isEmpty()) {
                int[] parsed = parseThoiGian(thoiGian);
                if (parsed != null) {
                    tietBD = parsed[0];
                    soTiet = parsed[1];
                }
            }

            String maLopEff = cur.get("maLop");
            if (maLopEff.isEmpty()) maLopEff = cur.get("ghiChu");
            if (maLopEff.isEmpty()) maLopEff = cur.get("maHP");

            String maHP = cur.get("maHP");
            if (maHP.isEmpty() && maLopEff.isEmpty()) continue;

            String classKey = maHP + "__" + maLopEff;

            if (!classMap.containsKey(classKey)) {
                ObjectNode cls = mapper.createObjectNode();
                cls.put("id", classKey);
                cls.put("maHP", maHP);
                cls.put("maLop", maLopEff);
                cls.put("tenHP", !cur.get("tenHP").isEmpty() ? cur.get("tenHP") : maHP);
                cls.put("tenHPEn", cur.get("tenHPEn"));
                cls.put("loaiHP", cur.get("loaiHP"));
                cls.put("soTC", cur.get("soTC"));
                cls.put("khoiLuong", cur.get("khoiLuong"));
                cls.put("cnDaoTao", !cur.get("cnDaoTao").isEmpty() ? cur.get("cnDaoTao") : cur.get("ghiChu"));
                cls.put("giangVien", cur.get("giangVien"));
                cls.put("trangThai", cur.get("trangThai"));
                cls.put("truong", cur.get("truong"));
                cls.put("siSo", cur.get("siSo"));
                cls.putArray("schedule");
                classMap.put(classKey, cls);
            } else {
                ObjectNode cls = classMap.get(classKey);
                if (cls.get("tenHP").asText().isEmpty() && !cur.get("tenHP").isEmpty())
                    cls.put("tenHP", cur.get("tenHP"));
                if (cls.get("giangVien").asText().isEmpty() && !cur.get("giangVien").isEmpty())
                    cls.put("giangVien", cur.get("giangVien"));
                if (cls.get("soTC").asText().isEmpty() && !cur.get("soTC").isEmpty())
                    cls.put("soTC", cur.get("soTC"));
            }

            try {
                int thuNum = Integer.parseInt(thu);
                if (thuNum >= 2 && thuNum <= 8 && tietBD >= 1) {
                    ObjectNode schedule = mapper.createObjectNode();
                    schedule.put("thu", thuNum);
                    schedule.put("tietBD", tietBD);
                    schedule.put("soTiet", soTiet > 0 ? soTiet : 1);
                    schedule.put("phong", phong);
                    schedule.put("buoi", getSessionFromPeriod(tietBD));
                    schedule.put("tuanHoc", tuan != null ? tuan : "");
                    ((ArrayNode) classMap.get(classKey).get("schedule")).add(schedule);
                }
            } catch (NumberFormatException ignored) {}
        }

        for (ObjectNode cls : classMap.values()) {
            classes.add(cls);
        }
        return classes;
    }
}
