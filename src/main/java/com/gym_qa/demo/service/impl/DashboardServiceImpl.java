package com.gym_qa.demo.service.impl;

import com.gym_qa.demo.dto.DashboardResumenDTO;
import com.gym_qa.demo.repository.PagoRepository;
import com.gym_qa.demo.repository.UsuarioRepository;
import com.gym_qa.demo.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;

@Service
public class DashboardServiceImpl implements DashboardService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PagoRepository pagoRepository;


    @Override
    public DashboardResumenDTO obtenerResumen() {
        LocalDate hoy = LocalDate.now();

        // 1. Conteo de usuarios por fecha de fin de membresía
        long activos = usuarioRepository.cuentasActivas(hoy);
        long vencidos = usuarioRepository.cuentasVencidas(hoy);

        // 2. Rango del mes actual para la suma de ingresos
        YearMonth mesActual = YearMonth.now();
        LocalDate inicioMes = mesActual.atDay(1);
        LocalDate finMes = mesActual.atEndOfMonth();

        BigDecimal ingresosMes = pagoRepository.sumarIngresosEntreFechas(inicioMes, finMes);

        if (ingresosMes == null) {
            ingresosMes = BigDecimal.ZERO;
        }

        // Pasamos 0L para sociosPorVencer ya que se maneja en otro módulo
        return new DashboardResumenDTO(activos, vencidos, 0L, ingresosMes);
    }
}
