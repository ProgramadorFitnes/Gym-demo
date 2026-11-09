package com.gym_qa.demo.controller;

import com.gym_qa.demo.dto.ResumenFinancieroDTO;
import com.gym_qa.demo.dto.TransaccionHistorialDTO;
import com.gym_qa.demo.service.HistorialVentasService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ventas")
@CrossOrigin(origins = "*")
public class VentasFinancierasController {

    @Autowired
    private HistorialVentasService historialVentasService;

    @GetMapping("/resumen")
    public ResponseEntity<ResumenFinancieroDTO> obtenerResumen() {
        return ResponseEntity.ok(historialVentasService.obtenerResumenFinanciero());
    }

    @GetMapping("/historial")
    public ResponseEntity<List<TransaccionHistorialDTO>> obtenerHistorial(
            @RequestParam(required = false, defaultValue = "TODOS") String tipo) {
        return ResponseEntity.ok(historialVentasService.obtenerHistorialTransacciones(tipo));
    }
}
