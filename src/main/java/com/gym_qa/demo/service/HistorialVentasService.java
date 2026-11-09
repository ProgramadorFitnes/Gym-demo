package com.gym_qa.demo.service;

import com.gym_qa.demo.dto.ResumenFinancieroDTO;
import com.gym_qa.demo.dto.TransaccionHistorialDTO;

import java.util.List;

public interface HistorialVentasService {
    ResumenFinancieroDTO obtenerResumenFinanciero();
    List<TransaccionHistorialDTO> obtenerHistorialTransacciones(String tipo);
}
