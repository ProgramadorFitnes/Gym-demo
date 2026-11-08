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
public class CorteCajaRequestDTO {
    private String usuarioResponsable;
    private BigDecimal fondoInicial;
    private BigDecimal efectivoReal;
    private String observaciones;
}
