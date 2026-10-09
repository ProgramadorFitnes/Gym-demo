package com.gym_qa.demo.controller;

import com.gym_qa.demo.dto.PagoRequestDTO;
import com.gym_qa.demo.entity.Pago;
import com.gym_qa.demo.service.PagoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/pagos")
@CrossOrigin(origins = "*")
public class PagoController {

    @Autowired
    private PagoService pagoService;

    @PostMapping
    public ResponseEntity<?> procesarPago(@RequestBody PagoRequestDTO request) {
        try {
            Pago nuevoPago = pagoService.registrarPago(request);
            return ResponseEntity.ok("Pago registrado exitosamente. ID Transacción: " + nuevoPago.getId());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error interno al procesar el pago");
        }
    }
}
