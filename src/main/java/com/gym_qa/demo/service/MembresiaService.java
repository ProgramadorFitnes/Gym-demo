package com.gym_qa.demo.service;

import com.gym_qa.demo.dto.MembresiaRequestDTO;
import com.gym_qa.demo.entity.Usuario;

public interface MembresiaService {
    Usuario actualizarMembresia(MembresiaRequestDTO requestDTO);
}
