package com.gym_qa.demo.service.impl;

import com.gym_qa.demo.dto.PagoRequestDTO;
import com.gym_qa.demo.entity.Pago;
import com.gym_qa.demo.entity.Usuario;
import com.gym_qa.demo.repository.PagoRepository;
import com.gym_qa.demo.repository.UsuarioRepository;
import com.gym_qa.demo.service.PagoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class PagoServiceImpl implements PagoService {

    @Autowired
    private PagoRepository pagoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    @Transactional
    public Pago registrarPago(PagoRequestDTO request) {
        Usuario usuario = usuarioRepository.findByCodigoSocio(request.getCodigoSocio())
                .orElseThrow(() -> new RuntimeException("Socio no encontrado con el código: " + request.getCodigoSocio()));

        LocalDate hoy = LocalDate.now();
        int mesesAjustar = (request.getMeses() != null && request.getMeses() > 0) ? request.getMeses() : 1;

        // Regla de renovación:
        // Si aún está vigente, se acumulan los meses al vencimiento actual.
        // Si ya venció o es nuevo, el periodo inicia HOY.
        if (usuario.getFechaMembresiaFin() != null && !usuario.getFechaMembresiaFin().isBefore(hoy)) {
            usuario.setFechaMembresiaFin(usuario.getFechaMembresiaFin().plusMonths(mesesAjustar));
        } else {
            usuario.setFechaMembresiaInicio(hoy);
            usuario.setFechaMembresiaFin(hoy.plusMonths(mesesAjustar));
        }

        usuarioRepository.save(usuario);

        Pago pago = Pago.builder()
                .monto(request.getMonto())
                .metodoPago(request.getMetodoPago())
                .fechaPago(LocalDate.now())
                .usuario(usuario)
                .mesesComprados(mesesAjustar).build();


        return pagoRepository.save(pago);
    }
}
