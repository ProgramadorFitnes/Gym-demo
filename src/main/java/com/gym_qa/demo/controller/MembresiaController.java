package com.gym_qa.demo.controller;

import com.gym_qa.demo.dto.MembresiaRequestDTO;
import com.gym_qa.demo.entity.Usuario;
import com.gym_qa.demo.service.MembresiaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/membresia")
public class MembresiaController {

    @Autowired
    private MembresiaService service;

    @PostMapping("/actualizar")
    public ResponseEntity<String> registrar(@RequestBody MembresiaRequestDTO requestDTO) {
        try {
            Usuario actualizarMembresia = service.actualizarMembresia(requestDTO);
            return ResponseEntity.ok("Usuario Actualizado correctamente con el código: " + actualizarMembresia.getCodigoSocio());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al registrar usuario: " + e.getMessage());
        }
    }

}
