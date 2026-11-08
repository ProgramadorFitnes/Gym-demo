package com.gym_qa.demo.entity;

import com.gym_qa.demo.entity.enums.TipoUnidad;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "Gym_Planes_Membresia")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PlanMembresia {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precio;

    @Column(nullable = false)
    private Integer cantidad;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_unidad", nullable = false, length = 20)
    private TipoUnidad tipoUnidad;

    @Column(nullable = false)
    private Boolean activo;
}
