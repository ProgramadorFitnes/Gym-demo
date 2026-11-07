package com.gym_qa.demo.service.impl;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.gym_qa.demo.entity.Pago;
import com.gym_qa.demo.repository.PagoRepository;
import com.gym_qa.demo.service.ReporteMensualService;
import jakarta.mail.internet.MimeMessage;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ReporteMensualServiceImpl implements ReporteMensualService {

    private final PagoRepository pagoRepository;
    private final JavaMailSender mailSender;

    public ReporteMensualServiceImpl(PagoRepository pagoRepository, JavaMailSender mailSender) {
        this.pagoRepository = pagoRepository;
        this.mailSender = mailSender;
    }

    // Cron: Segundos, Minutos, Horas, Día del Mes, Mes, Día de la Semana
    // "0 0 12 1 * ?" -> El día 1 de cada mes a las 12:00:00 del mediodía
    @Scheduled(cron = "0 0 12 1 * ?")
    public void generarYEnviarReporteMensual() {
        try {
            // 1. Calcular las fechas del mes pasado
            LocalDate hoy = LocalDate.now();
            LocalDate primerDiaMesPasado = hoy.minusMonths(1).withDayOfMonth(1);
            LocalDate ultimoDiaMesPasado = primerDiaMesPasado.withDayOfMonth(primerDiaMesPasado.lengthOfMonth());

            String mesPasadoStr = primerDiaMesPasado.format(DateTimeFormatter.ofPattern("MMMM_yyyy")).toUpperCase();

            // 2. Obtener datos de la base de datos
            List<Pago> pagos = pagoRepository.findPagosPorRangoDeFechas(primerDiaMesPasado, ultimoDiaMesPasado);

            // 3. Generar el PDF en memoria (ByteArray)
            byte[] pdfBytes = generarPdf(pagos, primerDiaMesPasado.getMonth().toString());

            // 4. Enviar el correo con el adjunto
            enviarCorreoConAdjunto(
                    "luisnahum1997@gmail.com", // <-- Cambia a tu correo de destino
                    "Reporte Mensual de Ingresos - " + mesPasadoStr,
                    "Hola,\n\nAdjunto encontrarás el reporte de ingresos correspondiente al mes de " + mesPasadoStr + ".\n\nTotal de transacciones: " + pagos.size(),
                    pdfBytes,
                    "Reporte_Pagos_" + mesPasadoStr + ".pdf"
            );

            System.out.println("Reporte mensual generado y enviado con éxito.");

        } catch (Exception e) {
            System.err.println("Error al generar el reporte mensual: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private byte[] generarPdf(List<Pago> pagos, String nombreMes) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Título
            Font fontTitulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Paragraph titulo = new Paragraph("Reporte de Ingresos - " + nombreMes, fontTitulo);
            titulo.setAlignment(Element.ALIGN_CENTER);
            titulo.setSpacingAfter(20);
            document.add(titulo);

            // Crear Tabla (6 columnas)
            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1f, 2f, 2f, 2f, 3f, 1.5f}); // Proporción del ancho de columnas

            // Cabeceras de la tabla
            String[] cabeceras = {"ID", "Monto ($)", "Método", "Fecha", "Socio", "Meses"};
            Font fontCabecera = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);

            for (String cabecera : cabeceras) {
                PdfPCell cell = new PdfPCell(new Phrase(cabecera, fontCabecera));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(5);
                table.addCell(cell);
            }

            // Llenar datos
            Font fontDato = FontFactory.getFont(FontFactory.HELVETICA, 10);
            double totalMonto = 0.0;

            for (Pago p : pagos) {
                table.addCell(new PdfPCell(new Phrase(String.valueOf(p.getId()), fontDato)));
                table.addCell(new PdfPCell(new Phrase(String.format("%.2f", p.getMonto()), fontDato)));
                table.addCell(new PdfPCell(new Phrase(String.valueOf(p.getMetodoPago()), fontDato)));
                table.addCell(new PdfPCell(new Phrase(p.getFechaPago().toString(), fontDato)));
                table.addCell(new PdfPCell(new Phrase(String.valueOf(p.getUsuario()), fontDato)));
                table.addCell(new PdfPCell(new Phrase(String.valueOf(p.getMesesComprados()), fontDato)));

                totalMonto += (p.getMonto() != null) ? p.getMonto().doubleValue() : 0.0;
            }

            document.add(table);

            // Total al final
            Paragraph totalInfo = new Paragraph("\nTotal Ingresos: $" + String.format("%.2f", totalMonto), fontTitulo);
            totalInfo.setAlignment(Element.ALIGN_RIGHT);
            document.add(totalInfo);

        } finally {
            document.close();
        }

        return out.toByteArray();
    }

    private void enviarCorreoConAdjunto(String destinatario, String asunto, String mensajeTxt, byte[] adjunto, String nombreArchivo) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();

        // El "true" indica que es un mensaje multipart (permite adjuntos)
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setTo(destinatario);
        helper.setSubject(asunto);
        helper.setText(mensajeTxt);

        // Agregar el PDF generado en memoria como adjunto
        ByteArrayResource pdfResource = new ByteArrayResource(adjunto);
        helper.addAttachment(nombreArchivo, pdfResource);

        mailSender.send(message);
    }
}

