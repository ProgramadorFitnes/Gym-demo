package com.gym_qa.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DashboardResumenDTO {
    private long totalSociosActivos;
    private long totalSociosVencidos;
    private long sociosPorVencer;
    private BigDecimal ingresosMesActual;

    // Getters alias para garantizar compatibilidad con frontend
    public long getSociosActivos() {
        return totalSociosActivos;
    }

    public long getSociosVencidos() {
        return totalSociosVencidos;
    }

    public BigDecimal getIngresosDelMes() {
        return ingresosMesActual != null ? ingresosMesActual : BigDecimal.ZERO;
    }
}
