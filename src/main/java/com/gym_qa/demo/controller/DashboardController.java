package com.gym_qa.demo.controller;

import com.gym_qa.demo.dto.*;
import com.gym_qa.demo.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/resumen")
    public ResponseEntity<DashboardResumenDTO> obtenerResumen() {
        DashboardResumenDTO resumen = dashboardService.obtenerResumen();
        return ResponseEntity.ok(resumen);
    }

    @GetMapping("/ingresos-mensuales")
    public ResponseEntity<List<IngresoMensualDTO>> obtenerIngresosMensuales() {
        return ResponseEntity.ok(dashboardService.obtenerIngresosMensuales());
    }

    @GetMapping("/horarios-pico")
    public ResponseEntity<List<HorarioPicoDTO>> obtenerHorariosPico() {
        return ResponseEntity.ok(dashboardService.obtenerHorariosPico());
    }

    @GetMapping("/estado-membresias")
    public ResponseEntity<EstadoMembresiasDTO> obtenerEstadoMembresias() {
        return ResponseEntity.ok(dashboardService.obtenerEstadoMembresias());
    }

    @GetMapping("/metodos-pago")
    public ResponseEntity<List<MetodoPagoDTO>> obtenerMetodosPago() {
        return ResponseEntity.ok(dashboardService.obtenerMetodosPago());
    }

    @GetMapping("/distribucion-planes")
    public ResponseEntity<List<DistribucionPlanDTO>> obtenerDistribucionPlanes() {
        return ResponseEntity.ok(dashboardService.obtenerDistribucionPlanes());
    }
}
