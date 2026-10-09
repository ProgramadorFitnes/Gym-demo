package com.gym_qa.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
@Data
@AllArgsConstructor @NoArgsConstructor
@Builder
public class UsuarioResumenDTO {
    private Long id;
    private String codigoSocio;
    private String nombre;
    private String telefono;
    private LocalDate fechaMembresiaInicio;
    private LocalDate fechaMembresiaFin;
    private boolean activo;
}
