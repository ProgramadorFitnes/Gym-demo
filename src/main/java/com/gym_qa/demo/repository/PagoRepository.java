package com.gym_qa.demo.repository;

import com.gym_qa.demo.entity.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface PagoRepository extends JpaRepository<Pago, Long> {

    @Query("SELECT COALESCE(SUM(p.monto), 0) FROM Pago p WHERE p.fechaPago >= :inicioMes AND p.fechaPago <= :finMes")
    BigDecimal sumarIngresosEntreFechas(@Param("inicioMes") LocalDate inicioMes, @Param("finMes") LocalDate finMes);
}
