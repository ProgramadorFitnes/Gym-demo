package com.gym_qa.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor @NoArgsConstructor
@Builder
public class HistorialAccesoResponseDTO {
     private LocalDateTime fechaHora;
     private String codigoUsuario;
     private String nombre;
     private String tipo;
     private String resultadoAcceso;
}
