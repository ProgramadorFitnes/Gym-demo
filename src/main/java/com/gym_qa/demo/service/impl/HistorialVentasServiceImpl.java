package com.gym_qa.demo.service.impl;

import com.gym_qa.demo.dto.ResumenFinancieroDTO;
import com.gym_qa.demo.dto.TransaccionHistorialDTO;
import com.gym_qa.demo.entity.Pago;
import com.gym_qa.demo.entity.Venta;
import com.gym_qa.demo.repository.PagoRepository;
import com.gym_qa.demo.repository.VentaRepository;
import com.gym_qa.demo.service.HistorialVentasService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class HistorialVentasServiceImpl implements HistorialVentasService {

    @Autowired
    private PagoRepository pagoRepository;

    @Autowired
    private VentaRepository ventaRepository;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Override
    public ResumenFinancieroDTO obtenerResumenFinanciero() {
        LocalDate hoy = LocalDate.now();
        LocalDate inicioMes = hoy.withDayOfMonth(1);
        LocalDate finMes = hoy.withDayOfMonth(hoy.lengthOfMonth());

        LocalDateTime inicioHoy = hoy.atStartOfDay();
        LocalDateTime finHoy = hoy.atTime(LocalTime.MAX);
        LocalDateTime inicioMesHora = inicioMes.atStartOfDay();
        LocalDateTime finMesHora = finMes.atTime(LocalTime.MAX);

        // 1. Membresías Hoy y Mes
        List<Pago> pagosHoy = pagoRepository.findByFechaPago(hoy);
        BigDecimal totalMembresiasHoy = pagosHoy.stream()
                .map(Pago::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalMembresiasMes = pagoRepository.sumarIngresosEntreFechas(inicioMes, finMes);
        if (totalMembresiasMes == null) totalMembresiasMes = BigDecimal.ZERO;

        // 2. Productos Mostrador POS Hoy y Mes
        BigDecimal totalProductosHoy = ventaRepository.sumarTotalEntreFechas(inicioHoy, finHoy);
        if (totalProductosHoy == null) totalProductosHoy = BigDecimal.ZERO;

        BigDecimal totalProductosMes = ventaRepository.sumarTotalEntreFechas(inicioMesHora, finMesHora);
        if (totalProductosMes == null) totalProductosMes = BigDecimal.ZERO;

        // 3. Totales consolidados
        BigDecimal totalVendidoHoy = totalMembresiasHoy.add(totalProductosHoy);
        BigDecimal totalVendidoMes = totalMembresiasMes.add(totalProductosMes);

        // 4. Conteo de transacciones
        List<Venta> ventasHoy = ventaRepository.findByFechaHoraBetweenOrderByFechaHoraDesc(inicioHoy, finHoy);
        long transaccionesHoy = pagosHoy.size() + (ventasHoy != null ? ventasHoy.size() : 0);

        List<Pago> pagosMes = pagoRepository.findPagosPorRangoDeFechas(inicioMes, finMes);
        List<Venta> ventasMes = ventaRepository.findByFechaHoraBetweenOrderByFechaHoraDesc(inicioMesHora, finMesHora);
        long transaccionesMes = (pagosMes != null ? pagosMes.size() : 0) + (ventasMes != null ? ventasMes.size() : 0);

        return ResumenFinancieroDTO.builder()
                .totalVendidoHoy(totalVendidoHoy)
                .totalVendidoMes(totalVendidoMes)
                .totalMembresiasHoy(totalMembresiasHoy)
                .totalProductosHoy(totalProductosHoy)
                .totalMembresiasMes(totalMembresiasMes)
                .totalProductosMes(totalProductosMes)
                .transaccionesHoy(transaccionesHoy)
                .transaccionesMes(transaccionesMes)
                .build();
    }

    @Override
    public List<TransaccionHistorialDTO> obtenerHistorialTransacciones(String tipo) {
        String filtro = (tipo != null && !tipo.isBlank()) ? tipo.trim().toUpperCase() : "TODOS";
        List<TransaccionHistorialDTO> resultado = new ArrayList<>();

        // Cargar pagos de membresía si corresponde
        if (filtro.equals("TODOS") || filtro.equals("MEMBRESIA") || filtro.equals("MEMBRESIAS")) {
            List<Pago> pagos = pagoRepository.findAllByOrderByIdDesc();
            for (Pago p : pagos) {
                String nombreSocio = (p.getUsuario() != null)
                        ? (p.getUsuario().getNombre() + " " + (p.getUsuario().getApellido() != null ? p.getUsuario().getApellido() : "")).trim()
                        : "Socio General";

                String codigoSocio = (p.getUsuario() != null && p.getUsuario().getCodigoSocio() != null)
                        ? p.getUsuario().getCodigoSocio()
                        : "---";

                String concepto;
                if (p.getPlanMembresia() != null) {
                    concepto = p.getPlanMembresia().getNombre();
                    if (p.getMesesComprados() != null && p.getMesesComprados() > 1 && !concepto.contains(String.valueOf(p.getMesesComprados()))) {
                        concepto += " (" + p.getMesesComprados() + " unidades)";
                    }
                } else {
                    concepto = "Membresía (" + (p.getMesesComprados() != null ? p.getMesesComprados() + " mes(es)" : "1 mes") + ")";
                }

                LocalDateTime fechaHora = p.getFechaPago() != null ? p.getFechaPago().atTime(12, 0) : LocalDateTime.now();

                resultado.add(TransaccionHistorialDTO.builder()
                        .id(p.getId())
                        .folio("MEM-" + p.getId())
                        .tipo("MEMBRESIA")
                        .tipoEtiqueta("Membresía")
                        .fechaHora(fechaHora)
                        .fechaHoraTexto(p.getFechaPago() != null ? p.getFechaPago().toString() : "N/A")
                        .concepto(concepto)
                        .metodoPago(p.getMetodoPago() != null ? p.getMetodoPago().name() : "EFECTIVO")
                        .monto(p.getMonto())
                        .usuarioResponsable("Caja General")
                        .clienteOSocio(nombreSocio + " [" + codigoSocio + "]")
                        .build());
            }
        }

        // Cargar ventas de productos del POS si corresponde
        if (filtro.equals("TODOS") || filtro.equals("PRODUCTO") || filtro.equals("PRODUCTOS")) {
            List<Venta> ventas = ventaRepository.findAllByOrderByFechaHoraDesc();
            for (Venta v : ventas) {
                String concepto;
                if (v.getDetalles() != null && !v.getDetalles().isEmpty()) {
                    concepto = v.getDetalles().stream()
                            .map(d -> d.getCantidad() + "x " + (d.getProducto() != null ? d.getProducto().getNombre() : "Producto"))
                            .collect(Collectors.joining(", "));
                } else {
                    concepto = "Venta Mostrador POS";
                }

                resultado.add(TransaccionHistorialDTO.builder()
                        .id(v.getId())
                        .folio("POS-" + v.getId())
                        .tipo("PRODUCTO")
                        .tipoEtiqueta("Mostrador POS")
                        .fechaHora(v.getFechaHora())
                        .fechaHoraTexto(v.getFechaHora() != null ? v.getFechaHora().format(FORMATTER) : "N/A")
                        .concepto(concepto)
                        .metodoPago(v.getMetodoPago() != null ? v.getMetodoPago().toUpperCase() : "EFECTIVO")
                        .monto(v.getTotal())
                        .usuarioResponsable(v.getUsuarioResponsable() != null ? v.getUsuarioResponsable() : "Recepcionista")
                        .clienteOSocio("Cliente Mostrador")
                        .build());
            }
        }

        // Ordenar de la más reciente a la más antigua
        resultado.sort((a, b) -> {
            if (a.getFechaHora() == null && b.getFechaHora() == null) return 0;
            if (a.getFechaHora() == null) return 1;
            if (b.getFechaHora() == null) return -1;
            int comp = b.getFechaHora().compareTo(a.getFechaHora());
            if (comp != 0) return comp;
            return b.getId().compareTo(a.getId());
        });

        return resultado;
    }
}
