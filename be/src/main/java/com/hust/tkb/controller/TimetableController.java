package com.hust.tkb.controller;

import com.hust.tkb.dto.ApiResponse;
import com.hust.tkb.dto.SaveTimetableRequest;
import com.hust.tkb.model.Timetable;
import com.hust.tkb.service.ExcelParserService;
import com.hust.tkb.service.TimetableService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/timetable")
@RequiredArgsConstructor
public class TimetableController {

    private final TimetableService timetableService;
    private final ExcelParserService excelParserService;

    /**
     * Upload Excel file và parse ra danh sách lớp
     */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<String>> uploadExcel(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("File trống"));
            }

            String classes = excelParserService.parseExcel(file);
            return ResponseEntity.ok(ApiResponse.ok("Parse thành công", classes));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Lỗi parse Excel: " + e.getMessage()));
        }
    }

    /**
     * Lưu TKB
     */
    @PostMapping("/save")
    public ResponseEntity<ApiResponse<Timetable>> save(@RequestBody SaveTimetableRequest request) {
        try {
            Timetable saved = timetableService.save(request);
            return ResponseEntity.ok(ApiResponse.ok("Đã lưu TKB", saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Lỗi lưu: " + e.getMessage()));
        }
    }

    /**
     * Cập nhật TKB
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Timetable>> update(
            @PathVariable Long id,
            @RequestBody SaveTimetableRequest request) {
        try {
            Timetable updated = timetableService.update(id, request);
            return ResponseEntity.ok(ApiResponse.ok("Đã cập nhật TKB", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Lỗi cập nhật: " + e.getMessage()));
        }
    }

    /**
     * Lấy danh sách TKB đã lưu
     */
    @GetMapping("/list")
    public ResponseEntity<ApiResponse<List<Timetable>>> list() {
        List<Timetable> timetables = timetableService.findAll();
        return ResponseEntity.ok(ApiResponse.ok(timetables));
    }

    /**
     * Lấy chi tiết 1 TKB
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Timetable>> getById(@PathVariable Long id) {
        return timetableService.findById(id)
                .map(t -> ResponseEntity.ok(ApiResponse.ok(t)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Xóa TKB
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        try {
            timetableService.delete(id);
            return ResponseEntity.ok(ApiResponse.ok("Đã xóa TKB", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Lỗi xóa: " + e.getMessage()));
        }
    }
}
