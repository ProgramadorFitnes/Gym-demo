package com.gym_qa.demo.service.impl;

import com.gym_qa.demo.dto.HistorialAccesoResponseDTO;
import com.gym_qa.demo.entity.RegistroAcceso;
import com.gym_qa.demo.entity.Usuario;
import com.gym_qa.demo.repository.AccesoRepository;
import com.gym_qa.demo.repository.UsuarioRepository;
import com.gym_qa.demo.service.AccesoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AccesoServiceImpl implements AccesoService {

    @Autowired
    private AccesoRepository accesoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public String procesarAcceso(String codigoSocio) {
        Optional<Usuario> optUsuario = usuarioRepository.findByCodigoSocio(codigoSocio);
        String resultado;
        if (optUsuario.isEmpty())
                resultado = "No_Encontrado";
        else {
            Usuario usuario = optUsuario.get();
            if (esMembresiaVigente(usuario) )
                resultado = "PERMITIDO";
            else
                resultado = "DENEGADO_VENCIDO";
        }

        RegistroAcceso registroAcceso = RegistroAcceso.builder()
                .codigoSocio(codigoSocio)
                .resultado(resultado)
                .fechaAcceso(LocalDateTime.now()).build();
        accesoRepository.save(registroAcceso);

        return resultado;
    }

    @Override
    public List<HistorialAccesoResponseDTO> obtenerHistorialAccesos() {
        return accesoRepository.obtenerHistorialDTO();
    }

    private boolean esMembresiaVigente(Usuario usuario) {
        // 1. Si es empleado, pasa directo
        // 2. Si es socio, validamos que fechaFin no sea nula y sea mayor o igual a hoy
        if (Boolean.TRUE.equals(usuario.getEsEmpleado()) ||
            (usuario.getFechaMembresiaFin() != null && !usuario.getFechaMembresiaFin().isBefore(LocalDate.now())))
            return true;
        else
            return false;

    }

}
