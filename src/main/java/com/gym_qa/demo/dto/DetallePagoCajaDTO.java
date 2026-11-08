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
public class DetallePagoCajaDTO {
    private Long id;
    private String codigoSocio;
    private String nombreSocio;
    private String nombrePlan;
    private String metodoPago;
    private BigDecimal monto;
}
