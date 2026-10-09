package com.gym_qa.demo.service.impl;

import com.gym_qa.demo.dto.MembresiaRequestDTO;
import com.gym_qa.demo.entity.Usuario;
import com.gym_qa.demo.repository.UsuarioRepository;
import com.gym_qa.demo.service.MembresiaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class MembresiaServiceImpl  implements MembresiaService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public Usuario actualizarMembresia(MembresiaRequestDTO requestDTO) {

        Usuario usuario = new Usuario();
        LocalDate hoy = LocalDate.now();

        if ( requestDTO != null && requestDTO.getCodigoSocio() != null
                && !requestDTO.getCodigoSocio().isEmpty()){
            usuario = usuarioRepository.findByCodigoSocio(requestDTO.getCodigoSocio()).get();
            return  actualizarMembresia(requestDTO, usuario, hoy);
        }else if(requestDTO.getTelefono() != null && !requestDTO.getTelefono().isEmpty()) {
            usuario = usuarioRepository.findByTelefono(requestDTO.getTelefono()).get();
            return actualizarMembresia(requestDTO, usuario, hoy);
        }else
            throw new RuntimeException("Codigo del socio o telefono no puede ser nulo");

    }

    private Usuario actualizarMembresia(MembresiaRequestDTO requestDTO, Usuario usuario, LocalDate hoy) {
        if (!usuario.getFechaMembresiaFin().isBefore(hoy))// solo aumentamos el  mes a la fecha de fin para aumentarle
            usuario.setFechaMembresiaFin(usuario.getFechaMembresiaFin().plusMonths(requestDTO.getMesesPagados()));

        else {// ya termino su membresia entonces seteamos la fecha inicio con now y un mes
            usuario.setFechaMembresiaInicio(hoy);
            usuario.setFechaMembresiaFin(hoy.plusMonths(requestDTO.getMesesPagados()));
        }
        usuarioRepository.save(usuario);
        return usuario;
    }
}
