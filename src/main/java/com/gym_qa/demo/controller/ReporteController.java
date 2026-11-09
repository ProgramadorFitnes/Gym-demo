package com.gym_qa.demo.controller;

import com.gym_qa.demo.service.ReporteMensualService;
import com.gym_qa.demo.service.ReporteMostradorService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/reportes")
@CrossOrigin(origins = "*")
public class ReporteController {

    private final ReporteMensualService reporteMensualService;
    private final ReporteMostradorService reporteMostradorService;

    public ReporteController(ReporteMensualService reporteMensualService,
                             ReporteMostradorService reporteMostradorService) {
        this.reporteMensualService = reporteMensualService;
        this.reporteMostradorService = reporteMostradorService;
    }

    // Endpoint de prueba para reporte mensual general (Membresías)
    @GetMapping("/test-envio-mensual")
    public ResponseEntity<String> testEnvioReporteMensual() {
        try {
            System.out.println("Ejecutando prueba de envío de reporte mensual de membresías...");
            reporteMensualService.generarYEnviarReporteMensual();
            return ResponseEntity.ok("¡Reporte general de membresías generado y enviado con éxito! Revisa la bandeja de entrada.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error al generar o enviar el reporte: " + e.getMessage());
        }
    }

    // Endpoint de prueba para reporte mensual de Venta de Mostrador (POS / Tienda)
    @GetMapping("/test-envio-mostrador")
    public ResponseEntity<String> testEnvioReporteMostrador(
            @RequestParam(required = false) Integer mes,
            @RequestParam(required = false) Integer anio,
            @RequestParam(required = false) String correo) {
        try {
            System.out.println("Ejecutando prueba de envío de reporte mensual de ventas de mostrador...");
            reporteMostradorService.generarYEnviarReporteMostrador(mes, anio, correo);
            String dest = (correo != null && !correo.isBlank()) ? correo : "luisnahum1997@gmail.com";
            return ResponseEntity.ok("¡Reporte mensual de ventas en mostrador (POS) generado y enviado con éxito a " + dest + "!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error al generar o enviar el reporte de mostrador: " + e.getMessage());
        }
    }

    // Endpoint para previsualizar o descargar directamente el PDF del reporte mensual de mostrador
    @GetMapping(value = "/descargar-pdf-mostrador", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> descargarPdfMostrador(
            @RequestParam(required = false) Integer mes,
            @RequestParam(required = false) Integer anio) {
        try {
            int mesFinal = (mes != null && mes >= 1 && mes <= 12) ? mes : LocalDate.now().getMonthValue();
            int anioFinal = (anio != null && anio >= 2020) ? anio : LocalDate.now().getYear();

            byte[] pdfBytes = reporteMostradorService.generarPdfReporteMostrador(mesFinal, anioFinal);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("inline", "Reporte_Ventas_Mostrador_" + mesFinal + "_" + anioFinal + ".pdf");
            headers.setContentLength(pdfBytes.length);

            return ResponseEntity.ok().headers(headers).body(pdfBytes);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
