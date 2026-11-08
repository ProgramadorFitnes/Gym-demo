package com.gym_qa.demo.dto;

import com.gym_qa.demo.entity.enums.MetodoPago;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PagoRequestDTO {

    private String codigoSocio;
    private Long planMembresiaId;
    private Integer cantidad; // Multiplicador de unidades del plan (ej: 2 meses, 3 pases diarios)
    private MetodoPago metodoPago;

    // Campos opcionales para retrocompatibilidad
    private BigDecimal monto;
    private Integer meses;
}
