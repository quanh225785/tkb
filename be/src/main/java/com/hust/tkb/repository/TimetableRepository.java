package com.hust.tkb.repository;

import com.hust.tkb.model.Timetable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimetableRepository extends JpaRepository<Timetable, Long> {
    List<Timetable> findAllByOrderByUpdatedAtDesc();
}
