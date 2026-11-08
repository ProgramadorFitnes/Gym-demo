package com.gym_qa.demo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Gym_Corte_Caja")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CorteCaja {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora;

    @Column(name = "usuario_responsable", nullable = false, length = 100)
    private String usuarioResponsable;

    @Column(name = "fondo_inicial", nullable = false, precision = 10, scale = 2)
    private BigDecimal fondoInicial;

    @Column(name = "total_efectivo", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalEfectivo;

    @Column(name = "total_tarjeta", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalTarjeta;

    @Column(name = "total_transferencia", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalTransferencia;

    @Column(name = "total_ingresos", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalIngresos;

    @Column(name = "total_esperado_efectivo", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalEsperadoEfectivo;

    @Column(name = "efectivo_real", nullable = false, precision = 10, scale = 2)
    private BigDecimal efectivoReal;

    @Column(name = "diferencia", nullable = false, precision = 10, scale = 2)
    private BigDecimal diferencia;

    @Column(length = 500)
    private String observaciones;
}
