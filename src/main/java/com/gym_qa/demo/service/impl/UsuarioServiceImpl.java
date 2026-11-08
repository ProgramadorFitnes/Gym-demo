package com.gym_qa.demo.service.impl;

import com.gym_qa.demo.dto.UsuarioResumenDTO;
import com.gym_qa.demo.entity.Usuario;
import com.gym_qa.demo.repository.UsuarioRepository;
import com.gym_qa.demo.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UsuarioServiceImpl implements UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public Usuario registrarUsuario(Usuario usuario) {
        if (usuario.getCodigoSocio() != null) {
            usuario.setCodigoSocio(usuario.getCodigoSocio().trim().toUpperCase());
        }

        // Si no se especifica esEmpleado, aseguramos false por defecto
        if (usuario.getEsEmpleado() == null) {
            usuario.setEsEmpleado(false);
        }

        // Asignamos fecha de inicio hoy si viene nula
        if (usuario.getFechaMembresiaInicio() == null) {
            usuario.setFechaMembresiaInicio(LocalDate.now());
        }

        // Si es empleado, le damos 10 años de vigencia.
        // Si es socio regular y no trae fecha fin explícita, iniciamos vencido (ayer)
        // para que al procesarse su pago inmediatamente después, la vigencia se calcule
        // exactamente según el plan contratado (1 día, 7 días, 1 mes, etc.) a partir de hoy.
        if (usuario.getFechaMembresiaFin() == null) {
            if (Boolean.TRUE.equals(usuario.getEsEmpleado())) {
                usuario.setFechaMembresiaFin(usuario.getFechaMembresiaInicio().plusYears(10));
            } else {
                usuario.setFechaMembresiaFin(LocalDate.now().minusDays(1));
            }
        }

        return usuarioRepository.save(usuario);
    }

    @Override
    public List<UsuarioResumenDTO> buscarSocios(String query) {
        // 1. Si la consulta viene vacía o nula, devolvemos todos
        if (query == null || query.isBlank()) {
            return usuarioRepository.findAll().stream()
                    .map(this::convertirADTO)
                    .collect(Collectors.toList());
        }

        String terminoLimpio = query.trim();
        List<Usuario> usuarios = usuarioRepository.buscarPorFiltroGeneral(terminoLimpio);
        if (usuarios == null || usuarios.isEmpty()) {
            return Collections.emptyList();
        }

        return usuarios.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    @Override
    public UsuarioResumenDTO obtenerPorCodigo(String codigoSocio) {
        Usuario usuario = usuarioRepository.findByCodigoSocio(codigoSocio)
                .orElseThrow(() -> new RuntimeException("Socio no encontrado con el código: " + codigoSocio));
        return convertirADTO(usuario);
    }

    @Override
    public List<UsuarioResumenDTO> obtenerPorVencer(int dias) {
        LocalDate hoy = LocalDate.now();
        LocalDate limite = hoy.plusDays(dias);
        return usuarioRepository.findByFechaMembresiaFinBetween(hoy, limite)
                .stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    @Override
    public UsuarioResumenDTO cambiarEstatusEmpleado(String codigoSocio, boolean esEmpleado) {
        Usuario usuario = usuarioRepository.findByCodigoSocio(codigoSocio)
                .orElseThrow(() -> new RuntimeException("Socio no encontrado: " + codigoSocio));

        usuario.setEsEmpleado(esEmpleado);

        if (esEmpleado) {
            usuario.setFechaMembresiaInicio(LocalDate.now());
            usuario.setFechaMembresiaFin(LocalDate.now().plusYears(10));
        } else {
            usuario.setFechaMembresiaFin(LocalDate.now().minusDays(1));
        }

        Usuario usuarioActualizado = usuarioRepository.save(usuario);
        return convertirADTO(usuarioActualizado);
    }

    private UsuarioResumenDTO convertirADTO(Usuario u) {
        boolean activo = estatusUsuario(u.getFechaMembresiaFin());
        return UsuarioResumenDTO.builder()
                .id(u.getId())
                .codigoSocio(u.getCodigoSocio())
                .nombre(u.getNombre() != null ? u.getNombre().trim() : "")
                .apellido(u.getApellido() != null ? u.getApellido().trim() : "")
                .telefono(u.getTelefono() != null ? u.getTelefono() : "S/N")
                .fechaMembresiaInicio(u.getFechaMembresiaInicio())
                .fechaMembresiaFin(u.getFechaMembresiaFin())
                .activo(activo)
                .estadoMembresia(activo ? "ACTIVA" : "VENCIDA")
                .build();
    }

    private boolean estatusUsuario(LocalDate fechaMembresiaFin) {
        if (fechaMembresiaFin == null) {
            return false;
        }
        LocalDate hoy = LocalDate.now();
        return !fechaMembresiaFin.isBefore(hoy);
    }
}
