package com.gym_qa.demo.service.impl;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.gym_qa.demo.entity.DetalleVenta;
import com.gym_qa.demo.entity.Venta;
import com.gym_qa.demo.repository.VentaRepository;
import com.gym_qa.demo.service.ReporteMostradorService;
import jakarta.mail.internet.MimeMessage;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReporteMostradorServiceImpl implements ReporteMostradorService {

    private final VentaRepository ventaRepository;
    private final JavaMailSender mailSender;

    private static final String CORREO_POR_DEFECTO = "luisnahum1997@gmail.com";
    private static final DateTimeFormatter FECHA_HORA_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public ReporteMostradorServiceImpl(VentaRepository ventaRepository, JavaMailSender mailSender) {
        this.ventaRepository = ventaRepository;
        this.mailSender = mailSender;
    }

    // Cron: El día 1 de cada mes a las 12:30:00 del mediodía
    @Scheduled(cron = "0 30 12 1 * ?")
    @Override
    public void generarYEnviarReporteMostrador() {
        LocalDate hoy = LocalDate.now();
        LocalDate mesPasado = hoy.minusMonths(1);
        generarYEnviarReporteMostrador(mesPasado.getMonthValue(), mesPasado.getYear(), CORREO_POR_DEFECTO);
    }

    @Override
    public void generarYEnviarReporteMostrador(Integer mes, Integer anio, String correoDestino) {
        LocalDate hoy = LocalDate.now();
        int mesFinal = (mes != null && mes >= 1 && mes <= 12) ? mes : hoy.getMonthValue();
        int anioFinal = (anio != null && anio >= 2020) ? anio : hoy.getYear();
        String destinatario = (correoDestino != null && !correoDestino.trim().isEmpty())
                ? correoDestino.trim()
                : CORREO_POR_DEFECTO;

        LocalDate primerDia = LocalDate.of(anioFinal, mesFinal, 1);
        String nombreMes = primerDia.getMonth().getDisplayName(TextStyle.FULL, new Locale("es", "MX")).toUpperCase();
        String mesAnioStr = nombreMes + "_" + anioFinal;

        byte[] pdfBytes = generarPdfReporteMostrador(mesFinal, anioFinal);

        LocalDateTime start = primerDia.atStartOfDay();
        LocalDateTime end = primerDia.withDayOfMonth(primerDia.lengthOfMonth()).atTime(LocalTime.MAX);
        List<Venta> ventas = ventaRepository.findByFechaHoraBetweenOrderByFechaHoraDesc(start, end);
        BigDecimal totalFacturado = ventas.stream().map(Venta::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add);

        try {
            enviarCorreoConAdjunto(
                    destinatario,
                    "Reporte Mensual de Ventas de Mostrador (POS) - " + nombreMes + " " + anioFinal,
                    "Estimado Administrador,\n\n"
                            + "Adjunto encontrarás el reporte mensual detallado de ventas en mostrador (POS / Tienda) correspondiente a "
                            + nombreMes + " " + anioFinal + ".\n\n"
                            + "Resumen del periodo:\n"
                            + "- Total de Transacciones: " + ventas.size() + "\n"
                            + "- Facturación Total en Mostrador: $" + String.format("%.2f", totalFacturado) + "\n\n"
                            + "Sistema de Control Gym QA",
                    pdfBytes,
                    "Reporte_Ventas_Mostrador_" + mesAnioStr + ".pdf"
            );
            System.out.println("Reporte de mostrador enviado exitosamente a: " + destinatario);
        } catch (Exception e) {
            System.err.println("Error al enviar correo con reporte de mostrador: " + e.getMessage());
            throw new RuntimeException("Error al enviar correo: " + e.getMessage(), e);
        }
    }

    @Override
    public byte[] generarPdfReporteMostrador(Integer mes, Integer anio) {
        LocalDate hoy = LocalDate.now();
        int mesFinal = (mes != null && mes >= 1 && mes <= 12) ? mes : hoy.getMonthValue();
        int anioFinal = (anio != null && anio >= 2020) ? anio : hoy.getYear();

        LocalDate primerDia = LocalDate.of(anioFinal, mesFinal, 1);
        LocalDate ultimoDia = primerDia.withDayOfMonth(primerDia.lengthOfMonth());
        String nombreMes = primerDia.getMonth().getDisplayName(TextStyle.FULL, new Locale("es", "MX")).toUpperCase();

        LocalDateTime start = primerDia.atStartOfDay();
        LocalDateTime end = ultimoDia.atTime(LocalTime.MAX);

        List<Venta> ventas = ventaRepository.findByFechaHoraBetweenOrderByFechaHoraDesc(start, end);

        // Si no hay ventas en el mes solicitado pero es el mes anterior y el actual sí tiene, o viceversa para pruebas
        if (ventas.isEmpty() && mesFinal != hoy.getMonthValue()) {
            LocalDateTime hoyStart = hoy.withDayOfMonth(1).atStartOfDay();
            LocalDateTime hoyEnd = hoy.withDayOfMonth(hoy.lengthOfMonth()).atTime(LocalTime.MAX);
            List<Venta> ventasHoy = ventaRepository.findByFechaHoraBetweenOrderByFechaHoraDesc(hoyStart, hoyEnd);
            if (!ventasHoy.isEmpty()) {
                ventas = ventasHoy;
                nombreMes = hoy.getMonth().getDisplayName(TextStyle.FULL, new Locale("es", "MX")).toUpperCase() + " (Mes Actual)";
                anioFinal = hoy.getYear();
            }
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 30, 30, 35, 35);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Estilos de fuentes
            Font fontEmpresa = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, new Color(49, 46, 129));
            Font fontTitulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, new Color(31, 41, 55));
            Font fontSubtitulo = FontFactory.getFont(FontFactory.HELVETICA, 10, new Color(107, 114, 128));
            Font fontCabecera = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
            Font fontDato = FontFactory.getFont(FontFactory.HELVETICA, 8, new Color(31, 41, 55));
            Font fontDatoBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, new Color(31, 41, 55));
            Font fontKpiValor = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, new Color(17, 24, 39));
            Font fontKpiEtiqueta = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, new Color(107, 114, 128));

            // Encabezado
            Paragraph emp = new Paragraph("CONTROL GYM QA", fontEmpresa);
            emp.setAlignment(Element.ALIGN_CENTER);
            document.add(emp);

            Paragraph tit = new Paragraph("REPORTE MENSUAL DE VENTAS EN MOSTRADOR (POS)", fontTitulo);
            tit.setAlignment(Element.ALIGN_CENTER);
            document.add(tit);

            Paragraph fechaGen = new Paragraph("Periodo Auditado: " + nombreMes + " " + anioFinal
                    + "  |  Fecha de Generación: " + LocalDateTime.now().format(FECHA_HORA_FORMAT), fontSubtitulo);
            fechaGen.setAlignment(Element.ALIGN_CENTER);
            fechaGen.setSpacingAfter(15);
            document.add(fechaGen);

            // Cálculos Estadísticos
            BigDecimal totalMonto = BigDecimal.ZERO;
            BigDecimal totalEfectivo = BigDecimal.ZERO;
            BigDecimal totalTarjeta = BigDecimal.ZERO;
            BigDecimal totalTransferencia = BigDecimal.ZERO;
            int totalUnidadesVendidas = 0;
            Map<String, int[]> rankingProductos = new HashMap<>(); // producto -> [cantidad, subtotalCentavos]

            for (Venta v : ventas) {
                totalMonto = totalMonto.add(v.getTotal());
                String met = (v.getMetodoPago() != null) ? v.getMetodoPago().toUpperCase() : "EFECTIVO";
                if (met.contains("TARJETA")) {
                    totalTarjeta = totalTarjeta.add(v.getTotal());
                } else if (met.contains("TRANS")) {
                    totalTransferencia = totalTransferencia.add(v.getTotal());
                } else {
                    totalEfectivo = totalEfectivo.add(v.getTotal());
                }

                if (v.getDetalles() != null) {
                    for (DetalleVenta d : v.getDetalles()) {
                        totalUnidadesVendidas += (d.getCantidad() != null ? d.getCantidad() : 0);
                        String prodNom = d.getProducto() != null ? d.getProducto().getNombre() : "Producto";
                        int cant = d.getCantidad() != null ? d.getCantidad() : 1;
                        int subCent = (d.getSubtotal() != null) ? d.getSubtotal().multiply(BigDecimal.valueOf(100)).intValue() : 0;

                        rankingProductos.compute(prodNom, (k, val) -> {
                            if (val == null) return new int[]{cant, subCent};
                            val[0] += cant;
                            val[1] += subCent;
                            return val;
                        });
                    }
                }
            }

            // Tarjetas KPI de Resumen (Tabla de 4 celdas)
            PdfPTable kpiTable = new PdfPTable(4);
            kpiTable.setWidthPercentage(100);
            kpiTable.setSpacingAfter(15);
            kpiTable.setWidths(new float[]{2.5f, 2.5f, 2.5f, 2.5f});

            agregarCeldaKpi(kpiTable, "FACTURACIÓN TOTAL", "$" + String.format("%.2f", totalMonto), fontKpiEtiqueta, fontKpiValor, new Color(243, 244, 246));
            agregarCeldaKpi(kpiTable, "TRANSACCIONES", String.valueOf(ventas.size()), fontKpiEtiqueta, fontKpiValor, new Color(243, 244, 246));
            agregarCeldaKpi(kpiTable, "ARTÍCULOS VENDIDOS", String.valueOf(totalUnidadesVendidas), fontKpiEtiqueta, fontKpiValor, new Color(243, 244, 246));
            BigDecimal promedioTicket = ventas.isEmpty() ? BigDecimal.ZERO : totalMonto.divide(BigDecimal.valueOf(ventas.size()), 2, java.math.RoundingMode.HALF_UP);
            agregarCeldaKpi(kpiTable, "TICKET PROMEDIO", "$" + String.format("%.2f", promedioTicket), fontKpiEtiqueta, fontKpiValor, new Color(243, 244, 246));

            document.add(kpiTable);

            // Desglose por Método de Pago
            PdfPTable metodosTable = new PdfPTable(3);
            metodosTable.setWidthPercentage(100);
            metodosTable.setSpacingAfter(15);
            metodosTable.setWidths(new float[]{1f, 1f, 1f});

            agregarCeldaMetodo(metodosTable, "Efectivo Cobrado", "$" + String.format("%.2f", totalEfectivo), new Color(16, 185, 129));
            agregarCeldaMetodo(metodosTable, "Tarjeta Cobrado", "$" + String.format("%.2f", totalTarjeta), new Color(6, 182, 212));
            agregarCeldaMetodo(metodosTable, "Transferencia Cobrado", "$" + String.format("%.2f", totalTransferencia), new Color(168, 85, 247));

            document.add(metodosTable);

            // Sección 1: Desglose de Ventas Registradas
            Paragraph seccion1 = new Paragraph("DETALLE DE TRANSACCIONES DEL MES", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, new Color(55, 65, 81)));
            seccion1.setSpacingAfter(6);
            document.add(seccion1);

            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1f, 2f, 1.8f, 1.6f, 3.8f, 1.8f});
            table.setSpacingAfter(20);

            // Cabeceras
            String[] cabeceras = {"Folio", "Fecha / Hora", "Atendió", "Método", "Artículos Vendidos", "Total ($)"};
            Color colorCabecera = new Color(79, 70, 229); // Indigo

            for (String cabecera : cabeceras) {
                PdfPCell cell = new PdfPCell(new Phrase(cabecera, fontCabecera));
                cell.setBackgroundColor(colorCabecera);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(6);
                table.addCell(cell);
            }

            // Datos
            boolean filaPar = false;
            Color colorFilaPar = new Color(249, 250, 251);

            if (ventas.isEmpty()) {
                PdfPCell celdaVacia = new PdfPCell(new Phrase("No se registraron ventas de mostrador en el periodo seleccionado.", fontDato));
                celdaVacia.setColspan(6);
                celdaVacia.setHorizontalAlignment(Element.ALIGN_CENTER);
                celdaVacia.setPadding(12);
                table.addCell(celdaVacia);
            } else {
                for (Venta v : ventas) {
                    Color bgFila = filaPar ? colorFilaPar : Color.WHITE;
                    filaPar = !filaPar;

                    String concepto = (v.getDetalles() != null && !v.getDetalles().isEmpty())
                            ? v.getDetalles().stream().map(d -> d.getCantidad() + "x " + (d.getProducto() != null ? d.getProducto().getNombre() : "Producto")).collect(Collectors.joining(", "))
                            : "Venta Mostrador";

                    table.addCell(crearCeldaDato("POS-" + v.getId(), fontDatoBold, Element.ALIGN_CENTER, bgFila));
                    table.addCell(crearCeldaDato(v.getFechaHora() != null ? v.getFechaHora().format(FECHA_HORA_FORMAT) : "N/A", fontDato, Element.ALIGN_CENTER, bgFila));
                    table.addCell(crearCeldaDato(v.getUsuarioResponsable() != null ? v.getUsuarioResponsable() : "Caja", fontDato, Element.ALIGN_LEFT, bgFila));
                    table.addCell(crearCeldaDato(v.getMetodoPago() != null ? v.getMetodoPago() : "Efectivo", fontDato, Element.ALIGN_CENTER, bgFila));
                    table.addCell(crearCeldaDato(concepto, fontDato, Element.ALIGN_LEFT, bgFila));
                    table.addCell(crearCeldaDato("$" + String.format("%.2f", v.getTotal()), fontDatoBold, Element.ALIGN_RIGHT, bgFila));
                }
            }

            document.add(table);

            // Sección 2: Ranking de Productos Vendidos
            if (!rankingProductos.isEmpty()) {
                Paragraph seccion2 = new Paragraph("RESUMEN DE PRODUCTOS VENDIDOS EN EL MES", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, new Color(55, 65, 81)));
                seccion2.setSpacingAfter(6);
                document.add(seccion2);

                PdfPTable prodTable = new PdfPTable(3);
                prodTable.setWidthPercentage(100);
                prodTable.setWidths(new float[]{5f, 2f, 2.5f});
                prodTable.setSpacingAfter(25);

                String[] cabecerasProd = {"Producto / Artículo", "Unidades Vendidas", "Subtotal Recaudado ($)"};
                Color colorCabeceraProd = new Color(217, 119, 6); // Amber

                for (String cab : cabecerasProd) {
                    PdfPCell cell = new PdfPCell(new Phrase(cab, fontCabecera));
                    cell.setBackgroundColor(colorCabeceraProd);
                    cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                    cell.setPadding(5);
                    prodTable.addCell(cell);
                }

                List<Map.Entry<String, int[]>> listaRanking = new ArrayList<>(rankingProductos.entrySet());
                listaRanking.sort((a, b) -> Integer.compare(b.getValue()[0], a.getValue()[0]));

                boolean filaParProd = false;
                for (Map.Entry<String, int[]> entry : listaRanking) {
                    Color bg = filaParProd ? colorFilaPar : Color.WHITE;
                    filaParProd = !filaParProd;

                    double subtotal = entry.getValue()[1] / 100.0;
                    prodTable.addCell(crearCeldaDato(entry.getKey(), fontDatoBold, Element.ALIGN_LEFT, bg));
                    prodTable.addCell(crearCeldaDato(String.valueOf(entry.getValue()[0]) + " unidades", fontDato, Element.ALIGN_CENTER, bg));
                    prodTable.addCell(crearCeldaDato("$" + String.format("%.2f", subtotal), fontDatoBold, Element.ALIGN_RIGHT, bg));
                }

                document.add(prodTable);
            }

            // Pie de página con firma
            Paragraph firma = new Paragraph("\n\n_____________________________________\nFirma de Conformidad / Auditoría\nControl Gym QA - Módulo de Punto de Venta",
                    FontFactory.getFont(FontFactory.HELVETICA, 8, new Color(107, 114, 128)));
            firma.setAlignment(Element.ALIGN_CENTER);
            document.add(firma);

        } catch (DocumentException e) {
            throw new RuntimeException("Error al estructurar el documento PDF: " + e.getMessage(), e);
        } finally {
            document.close();
        }

        return out.toByteArray();
    }

    private void agregarCeldaKpi(PdfPTable table, String etiqueta, String valor, Font fontEtiqueta, Font fontValor, Color bg) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(bg);
        cell.setPadding(8);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setBorderColor(new Color(229, 231, 235));

        Paragraph pEtiqueta = new Paragraph(etiqueta, fontEtiqueta);
        pEtiqueta.setAlignment(Element.ALIGN_CENTER);
        cell.addElement(pEtiqueta);

        Paragraph pValor = new Paragraph(valor, fontValor);
        pValor.setAlignment(Element.ALIGN_CENTER);
        cell.addElement(pValor);

        table.addCell(cell);
    }

    private void agregarCeldaMetodo(PdfPTable table, String titulo, String monto, Color bordeColor) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(new Color(249, 250, 251));
        cell.setPadding(6);
        cell.setBorderColor(bordeColor);
        cell.setBorderWidth(1.5f);

        Paragraph pTit = new Paragraph(titulo, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, new Color(75, 85, 99)));
        pTit.setAlignment(Element.ALIGN_CENTER);
        cell.addElement(pTit);

        Paragraph pMonto = new Paragraph(monto, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new Color(17, 24, 39)));
        pMonto.setAlignment(Element.ALIGN_CENTER);
        cell.addElement(pMonto);

        table.addCell(cell);
    }

    private PdfPCell crearCeldaDato(String texto, Font font, int alignment, Color bg) {
        PdfPCell cell = new PdfPCell(new Phrase(texto, font));
        cell.setHorizontalAlignment(alignment);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setBackgroundColor(bg);
        cell.setPadding(5);
        cell.setBorderColor(new Color(243, 244, 246));
        return cell;
    }

    private void enviarCorreoConAdjunto(String destinatario, String asunto, String mensajeTxt, byte[] adjunto, String nombreArchivo) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setTo(destinatario);
        helper.setSubject(asunto);
        helper.setText(mensajeTxt);

        ByteArrayResource pdfResource = new ByteArrayResource(adjunto);
        helper.addAttachment(nombreArchivo, pdfResource);

        mailSender.send(message);
    }
}
