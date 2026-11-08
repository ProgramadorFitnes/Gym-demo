package com.gym_qa.demo.service;

import com.gym_qa.demo.dto.*;

import java.util.List;

public interface DashboardService {
    DashboardResumenDTO obtenerResumen();
    List<IngresoMensualDTO> obtenerIngresosMensuales();
    List<HorarioPicoDTO> obtenerHorariosPico();
    EstadoMembresiasDTO obtenerEstadoMembresias();
    List<MetodoPagoDTO> obtenerMetodosPago();
    List<DistribucionPlanDTO> obtenerDistribucionPlanes();
}
