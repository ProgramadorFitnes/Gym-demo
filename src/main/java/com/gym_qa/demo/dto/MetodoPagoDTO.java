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
public class MetodoPagoDTO {
    private String metodo;
    private long cantidad;
    private BigDecimal total;

    public String getNombre() {
        return metodo;
    }

    public BigDecimal getMonto() {
        return total != null ? total : BigDecimal.ZERO;
    }

    public long getTransacciones() {
        return cantidad;
    }
}
