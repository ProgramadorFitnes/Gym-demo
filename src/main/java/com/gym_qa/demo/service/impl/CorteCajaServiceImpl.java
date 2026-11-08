package com.gym_qa.demo.service.impl;

import com.gym_qa.demo.dto.CorteCajaRequestDTO;
import com.gym_qa.demo.dto.DetallePagoCajaDTO;
import com.gym_qa.demo.dto.ResumenCajaDTO;
import com.gym_qa.demo.entity.CorteCaja;
import com.gym_qa.demo.entity.Pago;
import com.gym_qa.demo.entity.enums.MetodoPago;
import com.gym_qa.demo.repository.CorteCajaRepository;
import com.gym_qa.demo.repository.PagoRepository;
import com.gym_qa.demo.service.CorteCajaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class CorteCajaServiceImpl implements CorteCajaService {

    @Autowired
    private PagoRepository pagoRepository;

    @Autowired
    private CorteCajaRepository corteCajaRepository;

    @Override
    @Transactional(readOnly = true)
    public ResumenCajaDTO obtenerResumenHoy() {
        LocalDate hoy = LocalDate.now();
        List<Pago> pagosHoy = pagoRepository.findByFechaPago(hoy);
        if (pagosHoy == null) {
            pagosHoy = new ArrayList<>();
        }

        BigDecimal totalEfectivo = BigDecimal.ZERO;
        BigDecimal totalTarjeta = BigDecimal.ZERO;
        BigDecimal totalTransferencia = BigDecimal.ZERO;
        BigDecimal totalIngresos = BigDecimal.ZERO;
        List<DetallePagoCajaDTO> detallePagos = new ArrayList<>();

        for (Pago p : pagosHoy) {
            BigDecimal monto = p.getMonto() != null ? p.getMonto() : BigDecimal.ZERO;
            totalIngresos = totalIngresos.add(monto);

            if (p.getMetodoPago() != null) {
                if (p.getMetodoPago() == MetodoPago.EFECTIVO) {
                    totalEfectivo = totalEfectivo.add(monto);
                } else if (p.getMetodoPago() == MetodoPago.TARJETA) {
                    totalTarjeta = totalTarjeta.add(monto);
                } else if (p.getMetodoPago() == MetodoPago.TRANSFERENCIA) {
                    totalTransferencia = totalTransferencia.add(monto);
                }
            }

            String codigoSocio = (p.getUsuario() != null) ? p.getUsuario().getCodigoSocio() : "N/A";
            String nombreSocio = (p.getUsuario() != null) ? p.getUsuario().getNombre() : "Desconocido";
            String nombrePlan = (p.getPlanMembresia() != null) ? p.getPlanMembresia().getNombre() : 
                               (p.getMesesComprados() != null ? p.getMesesComprados() + " Mes(es)" : "General");
            String metodo = (p.getMetodoPago() != null) ? p.getMetodoPago().name() : "EFECTIVO";

            detallePagos.add(DetallePagoCajaDTO.builder()
                    .id(p.getId())
                    .codigoSocio(codigoSocio)
                    .nombreSocio(nombreSocio)
                    .nombrePlan(nombrePlan)
                    .metodoPago(metodo)
                    .monto(monto)
                    .build());
        }

        return ResumenCajaDTO.builder()
                .fecha(hoy)
                .totalEfectivo(totalEfectivo)
                .totalTarjeta(totalTarjeta)
                .totalTransferencia(totalTransferencia)
                .totalIngresos(totalIngresos)
                .cantidadTransacciones(detallePagos.size())
                .pagosHoy(detallePagos)
                .build();
    }

    @Override
    @Transactional
    public CorteCaja guardarCorte(CorteCajaRequestDTO request) {
        ResumenCajaDTO resumen = obtenerResumenHoy();

        BigDecimal fondoInicial = request.getFondoInicial() != null ? request.getFondoInicial() : BigDecimal.ZERO;
        BigDecimal efectivoReal = request.getEfectivoReal() != null ? request.getEfectivoReal() : BigDecimal.ZERO;
        BigDecimal totalEsperadoEfectivo = fondoInicial.add(resumen.getTotalEfectivo());
        BigDecimal diferencia = efectivoReal.subtract(totalEsperadoEfectivo);

        String usuario = (request.getUsuarioResponsable() != null && !request.getUsuarioResponsable().trim().isEmpty())
                ? request.getUsuarioResponsable().trim()
                : "Recepcionista General";

        CorteCaja corte = CorteCaja.builder()
                .fechaHora(LocalDateTime.now())
                .usuarioResponsable(usuario)
                .fondoInicial(fondoInicial)
                .totalEfectivo(resumen.getTotalEfectivo())
                .totalTarjeta(resumen.getTotalTarjeta())
                .totalTransferencia(resumen.getTotalTransferencia())
                .totalIngresos(resumen.getTotalIngresos())
                .totalEsperadoEfectivo(totalEsperadoEfectivo)
                .efectivoReal(efectivoReal)
                .diferencia(diferencia)
                .observaciones(request.getObservaciones())
                .build();

        return corteCajaRepository.save(corte);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CorteCaja> listarHistorial() {
        return corteCajaRepository.findAllByOrderByFechaHoraDesc();
    }
}
