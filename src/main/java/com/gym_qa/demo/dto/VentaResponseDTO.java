package com.gym_qa.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class VentaResponseDTO {
    private Long id;
    private Long folio;
    private LocalDateTime fechaHora;
    private BigDecimal total;
    private String metodoPago;
    private String usuarioResponsable;
    private List<DetalleVentaResponseDTO> detalles;
    private String mensaje;
}
