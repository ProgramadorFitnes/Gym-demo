package com.gym_qa.demo.controller;

import com.gym_qa.demo.dto.HistorialAccesoResponseDTO;
import com.gym_qa.demo.service.AccesoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/acceso")
@CrossOrigin(origins = "*")
public class AccesoRestController {

    @Autowired
    private AccesoService accesoService;

    @PostMapping
    public String validarAcceso(@RequestParam String codigoSocio) {
        return accesoService.procesarAcceso(codigoSocio);
    }
    @GetMapping
    public ResponseEntity<List<HistorialAccesoResponseDTO>> obtenerHistorial() {
        List<HistorialAccesoResponseDTO> historial = accesoService.obtenerHistorialAccesos();
        return ResponseEntity.ok(historial);
    }

}
