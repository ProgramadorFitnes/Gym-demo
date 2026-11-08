package com.gym_qa.demo.controller;

import com.gym_qa.demo.dto.PagoRequestDTO;
import com.gym_qa.demo.dto.PagoResponseDTO;
import com.gym_qa.demo.entity.Pago;
import com.gym_qa.demo.entity.PlanMembresia;
import com.gym_qa.demo.entity.Usuario;
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
            Usuario usuario = nuevoPago.getUsuario();
            PlanMembresia plan = nuevoPago.getPlanMembresia();
            int cant = (request.getCantidad() != null && request.getCantidad() > 0) ? request.getCantidad() : 1;

            String nombrePlan = plan != null ? plan.getNombre() : "Membresía";
            if (cant > 1) {
                nombrePlan = plan != null ? plan.getNombre() + " (x" + cant + ")" : "Membresía (x" + cant + ")";
            }

            PagoResponseDTO response = PagoResponseDTO.builder()
                    .id(nuevoPago.getId())
                    .folio(nuevoPago.getId() != null ? nuevoPago.getId() : 100000L)
                    .codigoSocio(usuario != null ? usuario.getCodigoSocio() : request.getCodigoSocio())
                    .nombreSocio(usuario != null ? (usuario.getNombre() + " " + (usuario.getApellido() != null ? usuario.getApellido() : "")).trim() : "")
                    .nombrePlan(nombrePlan)
                    .cantidad(cant)
                    .monto(nuevoPago.getMonto())
                    .metodoPago(nuevoPago.getMetodoPago() != null ? nuevoPago.getMetodoPago().name() : "EFECTIVO")
                    .fechaPago(nuevoPago.getFechaPago())
                    .fechaMembresiaFin(usuario != null ? usuario.getFechaMembresiaFin() : null)
                    .meses(nuevoPago.getMesesComprados() != null ? nuevoPago.getMesesComprados() : 1)
                    .mensaje("Pago registrado exitosamente. ID Transacción: " + nuevoPago.getId())
                    .build();

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error interno al procesar el pago: " + e.getMessage());
        }
    }
}
