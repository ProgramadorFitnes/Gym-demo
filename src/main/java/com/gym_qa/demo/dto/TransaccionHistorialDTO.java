package com.gym_qa.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TransaccionHistorialDTO {
    private Long id;
    private String folio;
    private String tipo;            // "MEMBRESIA" o "PRODUCTO"
    private String tipoEtiqueta;    // "Membresía" o "Mostrador POS"
    private LocalDateTime fechaHora;
    private String fechaHoraTexto;
    private String concepto;        // Nombre del plan o resumen de productos
    private String metodoPago;      // "EFECTIVO", "TARJETA", "TRANSFERENCIA"
    private BigDecimal monto;
    private String usuarioResponsable;
    private String clienteOSocio;
}
