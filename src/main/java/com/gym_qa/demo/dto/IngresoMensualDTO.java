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
public class IngresoMensualDTO {
    private String mes;
    private BigDecimal total;
    private long transacciones;

    public BigDecimal getMonto() {
        return total != null ? total : BigDecimal.ZERO;
    }

    public BigDecimal getIngresos() {
        return total != null ? total : BigDecimal.ZERO;
    }
}
