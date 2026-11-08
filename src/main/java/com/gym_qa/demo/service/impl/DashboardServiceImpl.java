package com.gym_qa.demo.service.impl;

import com.gym_qa.demo.dto.*;
import com.gym_qa.demo.entity.Pago;
import com.gym_qa.demo.entity.RegistroAcceso;
import com.gym_qa.demo.entity.Usuario;
import com.gym_qa.demo.entity.enums.MetodoPago;
import com.gym_qa.demo.repository.AccesoRepository;
import com.gym_qa.demo.repository.PagoRepository;
import com.gym_qa.demo.repository.UsuarioRepository;
import com.gym_qa.demo.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardServiceImpl implements DashboardService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PagoRepository pagoRepository;

    @Autowired
    private AccesoRepository accesoRepository;

    @Override
    public DashboardResumenDTO obtenerResumen() {
        LocalDate hoy = LocalDate.now();

        // 1. Conteo de usuarios por fecha de fin de membresía
        long activos = usuarioRepository.cuentasActivas(hoy);
        long vencidos = usuarioRepository.cuentasVencidas(hoy);

        List<Usuario> porVencerList = usuarioRepository.findByFechaMembresiaFinBetween(hoy, hoy.plusDays(5));
        long porVencer = porVencerList != null ? porVencerList.size() : 0L;

        // 2. Rango del mes actual para la suma de ingresos
        YearMonth mesActual = YearMonth.now();
        LocalDate inicioMes = mesActual.atDay(1);
        LocalDate finMes = mesActual.atEndOfMonth();

        BigDecimal ingresosMes = pagoRepository.sumarIngresosEntreFechas(inicioMes, finMes);

        if (ingresosMes == null) {
            ingresosMes = BigDecimal.ZERO;
        }

        return new DashboardResumenDTO(activos, vencidos, porVencer, ingresosMes);
    }

    @Override
    public List<IngresoMensualDTO> obtenerIngresosMensuales() {
        LocalDate ahora = LocalDate.now();
        LocalDate inicio = ahora.minusMonths(5).withDayOfMonth(1);
        LocalDate fin = ahora.withDayOfMonth(ahora.lengthOfMonth());

        List<Pago> pagos = pagoRepository.findPagosPorRangoDeFechas(inicio, fin);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy", new Locale("es", "MX"));
        List<IngresoMensualDTO> resultado = new ArrayList<>();

        for (int i = 5; i >= 0; i--) {
            YearMonth ym = YearMonth.from(ahora.minusMonths(i));
            String label = ym.format(formatter);
            if (label != null && !label.isEmpty()) {
                label = label.substring(0, 1).toUpperCase() + label.substring(1);
            }

            BigDecimal total = BigDecimal.ZERO;
            long count = 0;

            if (pagos != null) {
                for (Pago p : pagos) {
                    if (p.getFechaPago() != null && YearMonth.from(p.getFechaPago()).equals(ym)) {
                        total = total.add(p.getMonto() != null ? p.getMonto() : BigDecimal.ZERO);
                        count++;
                    }
                }
            }
            resultado.add(new IngresoMensualDTO(label, total, count));
        }

        return resultado;
    }

    @Override
    public List<HorarioPicoDTO> obtenerHorariosPico() {
        List<RegistroAcceso> accesos = accesoRepository.findAll();
        Map<Integer, Long> conteoPorHora = (accesos != null ? accesos : Collections.<RegistroAcceso>emptyList()).stream()
                .filter(a -> a.getFechaAcceso() != null)
                .collect(Collectors.groupingBy(a -> a.getFechaAcceso().getHour(), Collectors.counting()));

        List<HorarioPicoDTO> resultado = new ArrayList<>();
        // De 06:00 a 22:00 horas típicas de operación
        for (int h = 6; h <= 22; h++) {
            String horaLabel = String.format("%02d:00", h);
            long count = conteoPorHora.getOrDefault(h, 0L);
            resultado.add(new HorarioPicoDTO(horaLabel, count));
        }

        return resultado;
    }

    @Override
    public EstadoMembresiasDTO obtenerEstadoMembresias() {
        LocalDate hoy = LocalDate.now();
        long totalActivas = usuarioRepository.cuentasActivas(hoy);
        long vencidas = usuarioRepository.cuentasVencidas(hoy);

        List<Usuario> porVencerList = usuarioRepository.findByFechaMembresiaFinBetween(hoy, hoy.plusDays(5));
        long porVencer = porVencerList != null ? porVencerList.size() : 0L;
        long activas = Math.max(0, totalActivas - porVencer);

        return new EstadoMembresiasDTO(activas, porVencer, vencidas);
    }

    @Override
    public List<MetodoPagoDTO> obtenerMetodosPago() {
        List<Pago> pagos = pagoRepository.findAll();
        Map<MetodoPago, List<Pago>> agrupado = (pagos != null ? pagos : Collections.<Pago>emptyList()).stream()
                .filter(p -> p.getMetodoPago() != null)
                .collect(Collectors.groupingBy(Pago::getMetodoPago));

        List<MetodoPagoDTO> resultado = new ArrayList<>();
        for (MetodoPago mp : MetodoPago.values()) {
            List<Pago> lista = agrupado.getOrDefault(mp, Collections.emptyList());
            long cantidad = lista.size();
            BigDecimal total = lista.stream()
                    .map(p -> p.getMonto() != null ? p.getMonto() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            String nombre = mp.name().charAt(0) + mp.name().substring(1).toLowerCase();
            resultado.add(new MetodoPagoDTO(nombre, cantidad, total));
        }

        return resultado;
    }

    @Override
    public List<DistribucionPlanDTO> obtenerDistribucionPlanes() {
        List<Pago> pagos = pagoRepository.findAll();
        if (pagos == null || pagos.isEmpty()) {
            return Collections.emptyList();
        }

        // Agrupar pagos por nombre de plan
        Map<String, List<Pago>> pagosPorPlan = pagos.stream().collect(Collectors.groupingBy(p -> {
            if (p.getPlanMembresia() != null && p.getPlanMembresia().getNombre() != null) {
                return p.getPlanMembresia().getNombre();
            } else if (p.getMesesComprados() != null) {
                return p.getMesesComprados() + " Mes(es)";
            }
            return "General / Estándar";
        }));

        List<DistribucionPlanDTO> lista = new ArrayList<>();
        long sumaTotalClientesUnicos = 0;

        for (Map.Entry<String, List<Pago>> entry : pagosPorPlan.entrySet()) {
            String planNombre = entry.getKey();
            List<Pago> listaPagos = entry.getValue();

            long totalVentas = listaPagos.size();
            BigDecimal totalIngresos = listaPagos.stream()
                    .map(p -> p.getMonto() != null ? p.getMonto() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Filtro de conteo único: cada usuario cuenta una sola vez por plan
            Set<Long> usuariosUnicos = listaPagos.stream()
                    .filter(p -> p.getUsuario() != null && p.getUsuario().getId() != null)
                    .map(p -> p.getUsuario().getId())
                    .collect(Collectors.toSet());

            long clientesUnicos = usuariosUnicos.isEmpty() ? totalVentas : usuariosUnicos.size();
            sumaTotalClientesUnicos += clientesUnicos;

            lista.add(DistribucionPlanDTO.builder()
                    .nombrePlan(planNombre)
                    .clientesUnicos(clientesUnicos)
                    .totalVentas(totalVentas)
                    .totalIngresos(totalIngresos)
                    .porcentajeClientes(0.0) // Se calcula abajo
                    .build());
        }

        // Calcular porcentajes basados en la ponderación de clientes únicos
        if (sumaTotalClientesUnicos > 0) {
            for (DistribucionPlanDTO dto : lista) {
                double pct = ((double) dto.getClientesUnicos() / sumaTotalClientesUnicos) * 100.0;
                dto.setPorcentajeClientes(BigDecimal.valueOf(pct).setScale(1, RoundingMode.HALF_UP).doubleValue());
            }
        }

        // Ordenar descendentemente por clientes únicos
        lista.sort((a, b) -> Long.compare(b.getClientesUnicos(), a.getClientesUnicos()));
        return lista;
    }
}
