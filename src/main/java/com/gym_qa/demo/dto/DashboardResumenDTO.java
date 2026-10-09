package com.gym_qa.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;


@Data
@AllArgsConstructor @NoArgsConstructor
@Builder
public class DashboardResumenDTO {
    private long totalSociosActivos;
    private long totalSociosVencidos;
    private long sociosPorVencer;
    private BigDecimal ingresosMesActual;

}
