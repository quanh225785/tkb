package com.hust.tkb.service;

import com.hust.tkb.dto.SaveTimetableRequest;
import com.hust.tkb.model.Timetable;
import com.hust.tkb.repository.TimetableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TimetableService {

    private final TimetableRepository timetableRepository;

    public Timetable save(SaveTimetableRequest request) {
        Timetable timetable = Timetable.builder()
                .name(request.getName() != null ? request.getName() : "TKB " + System.currentTimeMillis())
                .selectedClasses(request.getSelectedClasses())
                .allClasses(request.getAllClasses())
                .subjectCodes(request.getSubjectCodes())
                .semester(request.getSemester())
                .fileName(request.getFileName())
                .build();
        return timetableRepository.save(timetable);
    }

    public Timetable update(Long id, SaveTimetableRequest request) {
        Timetable timetable = timetableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy TKB với id: " + id));

        if (request.getName() != null) timetable.setName(request.getName());
        if (request.getSelectedClasses() != null) timetable.setSelectedClasses(request.getSelectedClasses());
        if (request.getAllClasses() != null) timetable.setAllClasses(request.getAllClasses());
        if (request.getSubjectCodes() != null) timetable.setSubjectCodes(request.getSubjectCodes());
        if (request.getSemester() != null) timetable.setSemester(request.getSemester());
        if (request.getFileName() != null) timetable.setFileName(request.getFileName());

        return timetableRepository.save(timetable);
    }

    public List<Timetable> findAll() {
        return timetableRepository.findAllByOrderByUpdatedAtDesc();
    }

    public Optional<Timetable> findById(Long id) {
        return timetableRepository.findById(id);
    }

    public void delete(Long id) {
        timetableRepository.deleteById(id);
    }
}
