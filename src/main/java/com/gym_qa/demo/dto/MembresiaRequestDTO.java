package com.gym_qa.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor @NoArgsConstructor
public class MembresiaRequestDTO {

    private String codigoSocio;
    private String telefono;
    private Integer mesesPagados;
}
