package com.gym_qa.demo.repository;

import com.gym_qa.demo.entity.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VentaRepository extends JpaRepository<Venta, Long> {
    List<Venta> findAllByOrderByFechaHoraDesc();
    List<Venta> findByFechaHoraBetweenOrderByFechaHoraDesc(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(v.total), 0) FROM Venta v WHERE v.fechaHora >= :start AND v.fechaHora <= :end")
    BigDecimal sumarTotalEntreFechas(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
