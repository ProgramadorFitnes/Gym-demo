package com.gym_qa.demo.service.impl;

import com.gym_qa.demo.dto.UsuarioResumenDTO;
import com.gym_qa.demo.entity.Usuario;
import com.gym_qa.demo.repository.UsuarioRepository;
import com.gym_qa.demo.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UsuarioServiceImpl implements UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    private LocalDate hoy = LocalDate.now();


    @Override
    public Usuario registrarUsuario(Usuario usuario) {
        // Asignamos fecha de inicio hoy si viene nula
        if (usuario.getFechaMembresiaInicio() == null) {
            usuario.setFechaMembresiaInicio(LocalDate.now());
        }

        // Si es empleado o socio, calculamos 1 mes de vigencia por defecto
        if (usuario.getFechaMembresiaFin() == null) {
            usuario.setFechaMembresiaFin(usuario.getFechaMembresiaInicio().plusMonths(1));
        }

        // Si no se especifica esEmpleado, aseguramos false por defecto
        if (usuario.getEsEmpleado() == null) {
            usuario.setEsEmpleado(false);
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

        // 2. Intentar buscar por código de socio exacto
        Optional<Usuario> usuarioPorCodigo = usuarioRepository.findByCodigoSocio(terminoLimpio);
        if (usuarioPorCodigo.isPresent()) {
            return List.of(convertirADTO(usuarioPorCodigo.get()));
        }

        // 3. Si no se encuentra por código, intentar por teléfono exacto
        Optional<Usuario> usuarioPorTelefono = usuarioRepository.findByTelefono(terminoLimpio);
        return usuarioPorTelefono.map(usuario -> List.of(convertirADTO(usuario))).orElse(null);
    }

    @Override
    public UsuarioResumenDTO obtenerPorCodigo(String codigoSocio) {
        Usuario usuario = usuarioRepository.findByCodigoSocio(codigoSocio)
                .orElseThrow(() -> new RuntimeException("Socio no encontrado con el código: " + codigoSocio));
        return convertirADTO(usuario);
    }

    @Override
    public List<UsuarioResumenDTO> obtenerPorVencer(int dias) {
        LocalDate limite = hoy.plusDays(dias);
        return usuarioRepository.findByFechaMembresiaFinBetween(hoy, limite)
                .stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());    }

    @Override
    public UsuarioResumenDTO cambiarEstatusEmpleado(String codigoSocio, boolean esEmpleado) {
        Usuario usuario = usuarioRepository.findByCodigoSocio(codigoSocio)
                .orElseThrow(() -> new RuntimeException("Socio no encontrado: " + codigoSocio));

        // 1. Quitar el estatus de empleado
        usuario.setEsEmpleado(esEmpleado);

        if (esEmpleado) {
            // Al activarlo como staff, le otorgamos vigencia amplia
            usuario.setFechaMembresiaInicio(LocalDate.now());
            usuario.setFechaMembresiaFin(LocalDate.now().plusYears(10));
        } else {
            // Al desactivarlo, su membresía vence para que requiera pago
            usuario.setFechaMembresiaFin(LocalDate.now().minusDays(1));
        }

        Usuario usuarioActualizado = usuarioRepository.save(usuario);
        return convertirADTO(usuario);
    }

    private UsuarioResumenDTO convertirADTO(Usuario u) {
        return UsuarioResumenDTO.builder()
                .id(u.getId())
                .codigoSocio(u.getCodigoSocio())
                .nombre(u.getNombre())
                .telefono(u.getTelefono())
                .fechaMembresiaInicio(u.getFechaMembresiaInicio())
                .fechaMembresiaFin(u.getFechaMembresiaFin())
                .activo(estatusUsuario(u.getFechaMembresiaFin()))
                .build();

    }

    private boolean estatusUsuario(LocalDate fechaMembresiaFin  ){
        return fechaMembresiaFin.isAfter(hoy);
    }

}
