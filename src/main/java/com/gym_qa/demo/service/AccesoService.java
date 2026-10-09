package com.gym_qa.demo.service;

import com.gym_qa.demo.dto.HistorialAccesoResponseDTO;

import java.util.List;

public interface AccesoService {

    String procesarAcceso(String codigoSocio);

    List<HistorialAccesoResponseDTO> obtenerHistorialAccesos();
}
