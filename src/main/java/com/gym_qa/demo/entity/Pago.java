package com.gym_qa.demo.entity;

import com.gym_qa.demo.entity.enums.MetodoPago;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table (name = "Gym_Pagos")
@Data
@AllArgsConstructor @NoArgsConstructor
@Builder
public class Pago {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(nullable = false)
    private BigDecimal monto;

    @Column(name = "Metodo_pago", nullable = false)
    private MetodoPago metodoPago;

    @Column(name = "Fecha_pago", nullable = false)
    private LocalDate fechaPago;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false )
    private Usuario usuario;

    @Column(name = "meses_comprados", nullable = false)
    private Integer mesesComprados;

}
