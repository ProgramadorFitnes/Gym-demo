package com.gym_qa.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class VentaRequestDTO {
    private String metodoPago;
    private String usuarioResponsable;
    private List<VentaItemRequestDTO> items;
}
