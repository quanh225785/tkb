package com.hust.tkb.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "timetables")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Timetable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    /** JSON string chứa selectedClasses {maHP: classObj} */
    @Column(columnDefinition = "LONGTEXT")
    private String selectedClasses;

    /** JSON string chứa allClasses (tất cả lớp từ Excel) */
    @Column(columnDefinition = "LONGTEXT")
    private String allClasses;

    /** JSON string chứa danh sách mã HP đã chọn */
    @Column(columnDefinition = "TEXT")
    private String subjectCodes;

    private String semester;

    private String fileName;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
