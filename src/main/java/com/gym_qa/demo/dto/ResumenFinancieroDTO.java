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
public class ResumenFinancieroDTO {
    private BigDecimal totalVendidoHoy;
    private BigDecimal totalVendidoMes;
    private BigDecimal totalMembresiasHoy;
    private BigDecimal totalProductosHoy;
    private BigDecimal totalMembresiasMes;
    private BigDecimal totalProductosMes;
    private Long transaccionesHoy;
    private Long transaccionesMes;
}
