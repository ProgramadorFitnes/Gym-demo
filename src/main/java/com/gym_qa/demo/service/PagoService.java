package com.gym_qa.demo.service;

import com.gym_qa.demo.dto.PagoRequestDTO;
import com.gym_qa.demo.entity.Pago;

public interface PagoService {
    Pago registrarPago(PagoRequestDTO request);
}
