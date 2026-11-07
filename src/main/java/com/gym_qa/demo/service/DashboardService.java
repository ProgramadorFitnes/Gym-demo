package com.gym_qa.demo.service;

import com.gym_qa.demo.dto.DashboardResumenDTO;
import com.gym_qa.demo.dto.EstadoMembresiasDTO;
import com.gym_qa.demo.dto.HorarioPicoDTO;
import com.gym_qa.demo.dto.IngresoMensualDTO;
import com.gym_qa.demo.dto.MetodoPagoDTO;

import java.util.List;

public interface DashboardService {
    DashboardResumenDTO obtenerResumen();
    List<IngresoMensualDTO> obtenerIngresosMensuales();
    List<HorarioPicoDTO> obtenerHorariosPico();
    EstadoMembresiasDTO obtenerEstadoMembresias();
    List<MetodoPagoDTO> obtenerMetodosPago();
}
