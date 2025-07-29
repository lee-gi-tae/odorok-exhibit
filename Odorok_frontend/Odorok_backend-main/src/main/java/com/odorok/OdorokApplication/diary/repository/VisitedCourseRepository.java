package com.odorok.OdorokApplication.diary.repository;

import com.odorok.OdorokApplication.course.dto.process.CourseStat;
import com.odorok.OdorokApplication.domain.VisitedCourse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VisitedCourseRepository extends JpaRepository<VisitedCourse, Long>, VisitedCourseRepositoryCustom  {
    boolean existsByUserIdAndCourseId(Long userId, Long courseId);

    @Query(value = "SELECT AVG(v.stars) FROM visited_courses v WHERE v.course_id = :courseId", nativeQuery = true)
    Double findAvgStarsByCourseId(@Param("courseId") Long courseId);

    @Query(value = "SELECT COUNT(*) FROM visited_courses v WHERE v.course_id = :courseId and v.review IS NOT NULL", nativeQuery = true)
    Long countReviewsOf(@Param("courseId") Long courseId);
}
