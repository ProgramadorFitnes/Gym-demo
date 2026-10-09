package com.gym_qa.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AccesoResponseDTO {
    private String codigoSocio;
    private String resultado;
    private String mensaje;
}