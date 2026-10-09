package com.gym_qa.demo.service;

import com.gym_qa.demo.dto.UsuarioResumenDTO;
import com.gym_qa.demo.entity.Usuario;

import java.util.List;

public interface UsuarioService {

    Usuario registrarUsuario(Usuario usuario);

    List<UsuarioResumenDTO> buscarSocios(String query);

    public UsuarioResumenDTO obtenerPorCodigo(String codigoSocio);

    public List<UsuarioResumenDTO> obtenerPorVencer(int dias);

    UsuarioResumenDTO cambiarEstatusEmpleado(String codigoSocio, boolean esEmpleado);
}
