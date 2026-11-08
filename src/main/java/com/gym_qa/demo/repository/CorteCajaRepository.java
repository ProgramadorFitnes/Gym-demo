package com.gym_qa.demo.repository;

import com.gym_qa.demo.entity.CorteCaja;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CorteCajaRepository extends JpaRepository<CorteCaja, Long> {
    List<CorteCaja> findAllByOrderByFechaHoraDesc();
    List<CorteCaja> findByFechaHoraBetweenOrderByFechaHoraDesc(LocalDateTime inicio, LocalDateTime fin);
}
