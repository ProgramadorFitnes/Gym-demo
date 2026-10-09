package com.gym_qa.demo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table (name = "Gym_Usuarios")
@AllArgsConstructor @NoArgsConstructor
@Data
@Builder
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column (name = "Codigo_socio", nullable = false, unique = true, length = 7 )
    private String codigoSocio;

    @Column (name = "Nombre", nullable = false, length = 50)
    private String nombre;

    @Column (name = "Apellido", nullable = false , length = 60)
    private String apellido;

    @Column (name = "Telefono", length = 10, unique = true)
    private String telefono;

    @Column (name = "Correo", length = 100, unique = true)
    private String correo;

    @Column (name = "Fecha_Membresia_Inicio", nullable = false)
    private LocalDate fechaMembresiaInicio;

    @Column (name = "Fecha_Membresia_Fin", nullable = false)
    private LocalDate fechaMembresiaFin;

    @Column (name = "Es_Empleado", nullable = false)
    private Boolean esEmpleado;

}
