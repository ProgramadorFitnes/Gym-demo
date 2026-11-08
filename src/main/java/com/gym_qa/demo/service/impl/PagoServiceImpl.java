package com.gym_qa.demo.service.impl;

import com.gym_qa.demo.dto.PagoRequestDTO;
import com.gym_qa.demo.entity.Pago;
import com.gym_qa.demo.entity.PlanMembresia;
import com.gym_qa.demo.entity.Usuario;
import com.gym_qa.demo.entity.enums.TipoUnidad;
import com.gym_qa.demo.repository.PagoRepository;
import com.gym_qa.demo.repository.PlanMembresiaRepository;
import com.gym_qa.demo.repository.UsuarioRepository;
import com.gym_qa.demo.service.PagoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
public class PagoServiceImpl implements PagoService {

    @Autowired
    private PagoRepository pagoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PlanMembresiaRepository planMembresiaRepository;

    @Override
    @Transactional
    public Pago registrarPago(PagoRequestDTO request) {
        if (request.getCodigoSocio() == null || request.getCodigoSocio().trim().isEmpty()) {
            throw new RuntimeException("El código de socio es requerido.");
        }

        Usuario usuario = usuarioRepository.findByCodigoSocio(request.getCodigoSocio().trim().toUpperCase())
                .orElseThrow(() -> new RuntimeException("Socio no encontrado con el código: " + request.getCodigoSocio()));

        LocalDate hoy = LocalDate.now();
        PlanMembresia plan = null;
        BigDecimal montoTotal;
        LocalDate fechaBase;
        LocalDate nuevaFechaFin;

        // Multiplicador / cantidad enviado desde el frontend (mínimo 1)
        int multiplicador = (request.getCantidad() != null && request.getCantidad() > 0) ? request.getCantidad() : 1;

        // 1. Determinar el plan seleccionado
        if (request.getPlanMembresiaId() != null) {
            plan = planMembresiaRepository.findById(request.getPlanMembresiaId())
                    .orElseThrow(() -> new RuntimeException("Plan de membresía no encontrado con ID: " + request.getPlanMembresiaId()));

            if (plan.getActivo() != null && !plan.getActivo()) {
                throw new RuntimeException("El plan seleccionado está inactivo y no puede ser adquirido.");
            }

            // Costo total = precio oficial del plan * cantidad
            montoTotal = plan.getPrecio().multiply(BigDecimal.valueOf(multiplicador));

            int planCantidad = (plan.getCantidad() != null && plan.getCantidad() > 0) ? plan.getCantidad() : 1;
            int duracionTotal = planCantidad * multiplicador;
            TipoUnidad unidad = plan.getTipoUnidad() != null ? plan.getTipoUnidad() : TipoUnidad.MESES;

            // 2. Regla de oro de acumulación de tiempo:
            // Si el socio aún tiene membresía vigente (fechaMembresiaFin >= hoy),
            // el nuevo periodo se suma a partir de su fechaMembresiaFin actual.
            // Si ya venció o no tiene vigencia previa, empieza a contar a partir de hoy.
            boolean tieneMembresiaVigente = usuario.getFechaMembresiaFin() != null && !usuario.getFechaMembresiaFin().isBefore(hoy);

            if (tieneMembresiaVigente) {
                fechaBase = usuario.getFechaMembresiaFin();
            } else {
                fechaBase = hoy;
                usuario.setFechaMembresiaInicio(hoy);
            }

            // 3. Cálculo exacto multiplicando duración por cantidad antes de aplicar métodos LocalDate
            if (unidad == TipoUnidad.DIAS) {
                nuevaFechaFin = fechaBase.plusDays(duracionTotal);
            } else if (unidad == TipoUnidad.ANOS || unidad == TipoUnidad.AÑOS) {
                nuevaFechaFin = fechaBase.plusYears(duracionTotal);
            } else {
                // MESES por defecto
                nuevaFechaFin = fechaBase.plusMonths(duracionTotal);
            }

        } else {
            // Retrocompatibilidad en caso de no especificarse planId
            int mesesAjustar = (request.getMeses() != null && request.getMeses() > 0) ? request.getMeses() * multiplicador : multiplicador;
            montoTotal = request.getMonto() != null ? request.getMonto().multiply(BigDecimal.valueOf(multiplicador)) : new BigDecimal("350.00").multiply(BigDecimal.valueOf(multiplicador));

            if (usuario.getFechaMembresiaFin() != null && !usuario.getFechaMembresiaFin().isBefore(hoy)) {
                fechaBase = usuario.getFechaMembresiaFin();
            } else {
                fechaBase = hoy;
                usuario.setFechaMembresiaInicio(hoy);
            }
            nuevaFechaFin = fechaBase.plusMonths(mesesAjustar);
        }

        // Actualizar usuario
        usuario.setFechaMembresiaFin(nuevaFechaFin);
        usuarioRepository.save(usuario);

        // 4. Guardar registro de pago con el monto total pagado y detalle del plan
        Pago pago = Pago.builder()
                .monto(montoTotal)
                .metodoPago(request.getMetodoPago())
                .fechaPago(hoy)
                .usuario(usuario)
                .planMembresia(plan)
                .mesesComprados(plan != null ? (plan.getCantidad() * multiplicador) : (request.getMeses() != null ? request.getMeses() * multiplicador : multiplicador))
                .build();

        return pagoRepository.save(pago);
    }
}
