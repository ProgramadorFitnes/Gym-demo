package com.gym_qa.demo.dto;
import com.gym_qa.demo.entity.enums.MetodoPago;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor @NoArgsConstructor
public class PagoRequestDTO {

    private String codigoSocio;
    private BigDecimal monto;
    private MetodoPago metodoPago; // Jackson mapeará "EFECTIVO" a MetodoPago.EFECTIVO
    private Integer meses;

}
