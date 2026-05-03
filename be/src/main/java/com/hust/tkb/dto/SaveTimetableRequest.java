package com.hust.tkb.dto;

import lombok.*;

@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
public class SaveTimetableRequest {
    private String name;
    private String selectedClasses;   // JSON string
    private String allClasses;        // JSON string
    private String subjectCodes;      // JSON string
    private String semester;
    private String fileName;
}
