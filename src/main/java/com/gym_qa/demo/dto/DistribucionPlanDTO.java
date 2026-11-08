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
public class DistribucionPlanDTO {
    private String nombrePlan;
    private long clientesUnicos;
    private long totalVentas;
    private BigDecimal totalIngresos;
    private double porcentajeClientes;

    public String getPlan() {
        return nombrePlan;
    }

    public long getClientes() {
        return clientesUnicos;
    }

    public long getVentas() {
        return totalVentas;
    }

    public BigDecimal getIngresos() {
        return totalIngresos != null ? totalIngresos : BigDecimal.ZERO;
    }

    public double getPorcentaje() {
        return porcentajeClientes;
    }
}
