package com.gym_qa.demo.controller;

import com.gym_qa.demo.dto.CorteCajaRequestDTO;
import com.gym_qa.demo.dto.ResumenCajaDTO;
import com.gym_qa.demo.entity.CorteCaja;
import com.gym_qa.demo.service.CorteCajaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/caja")
@CrossOrigin(origins = "*")
public class CorteCajaController {

    @Autowired
    private CorteCajaService corteCajaService;

    @GetMapping("/resumen-hoy")
    public ResponseEntity<ResumenCajaDTO> obtenerResumenHoy() {
        return ResponseEntity.ok(corteCajaService.obtenerResumenHoy());
    }

    @PostMapping("/corte")
    public ResponseEntity<CorteCaja> realizarCorte(@RequestBody CorteCajaRequestDTO request) {
        CorteCaja corte = corteCajaService.guardarCorte(request);
        return new ResponseEntity<>(corte, HttpStatus.CREATED);
    }

    @GetMapping("/historial")
    public ResponseEntity<List<CorteCaja>> listarHistorial() {
        return ResponseEntity.ok(corteCajaService.listarHistorial());
    }
}
