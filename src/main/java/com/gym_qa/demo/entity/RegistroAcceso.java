package com.gym_qa.demo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table (name = "Gym_Registro_Acceso")
@Data
@AllArgsConstructor @NoArgsConstructor
@Builder
public class RegistroAcceso {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column (name = "Codigo_socio", length = 7 )
    private String codigoSocio;

    @Column (name = "Fecha_acceso", nullable = false)
    private LocalDateTime fechaAcceso;

    @Column (name = "Resultado")
    private String resultado;
}
