package com.gym_qa.demo.controller;

import com.gym_qa.demo.service.ReporteMensualService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/reportes")
@CrossOrigin(origins = "*")
public class ReporteController {

    private final ReporteMensualService reporteMensualService;

    public ReporteController(ReporteMensualService reporteMensualService) {
        this.reporteMensualService = reporteMensualService;
    }

    // Endpoint exclusivo para pruebas (Testing)
    @GetMapping("/test-envio-mensual")
    public ResponseEntity<String> testEnvioReporteMensual() {
        try {
            System.out.println("Ejecutando prueba de envío de reporte mensual...");

            // Llamamos al mismo método que ejecuta el @Scheduled
            reporteMensualService.generarYEnviarReporteMensual();

            return ResponseEntity.ok("¡Reporte generado y enviado con éxito! Revisa la bandeja de entrada del correo destino.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error al generar o enviar el reporte: " + e.getMessage());
        }
    }
}