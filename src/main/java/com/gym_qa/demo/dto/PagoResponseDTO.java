package com.gym_qa.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PagoResponseDTO {
    private Long id;
    private Long folio;
    private String codigoSocio;
    private String nombreSocio;
    private String nombrePlan;
    private Integer cantidad;
    private BigDecimal monto;
    private String metodoPago;
    private LocalDate fechaPago;
    private LocalDate fechaMembresiaFin;
    private Integer meses;
    private String mensaje;
}
