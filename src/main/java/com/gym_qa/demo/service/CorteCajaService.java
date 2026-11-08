package com.gym_qa.demo.service;

import com.gym_qa.demo.dto.CorteCajaRequestDTO;
import com.gym_qa.demo.dto.ResumenCajaDTO;
import com.gym_qa.demo.entity.CorteCaja;

import java.util.List;

public interface CorteCajaService {
    ResumenCajaDTO obtenerResumenHoy();
    CorteCaja guardarCorte(CorteCajaRequestDTO request);
    List<CorteCaja> listarHistorial();
}
