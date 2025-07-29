package com.odorok.OdorokApplication.course.repository;

import com.odorok.OdorokApplication.commons.querydsl.config.QueryDslConfig;
import com.odorok.OdorokApplication.infrastructures.domain.PathCoord;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;


@DataJpaTest
@Import(QueryDslConfig.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class PathCoordRepositoryTest {
    @Autowired
    private PathCoordRepository pathCoordRepository;
    private final Long COURSE_ID = 1L;

    @Test
    public void 코스_좌표_조회에_성공한다() {
        List<PathCoord> coords = pathCoordRepository.findAll();
        System.out.println(coords);
        assertThat(coords.size()).isNotZero();
    }
}