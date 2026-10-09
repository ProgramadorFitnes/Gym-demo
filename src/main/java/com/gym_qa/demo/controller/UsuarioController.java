package com.gym_qa.demo.controller;
import com.gym_qa.demo.dto.UsuarioResumenDTO;
import com.gym_qa.demo.entity.Usuario;
import com.gym_qa.demo.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {
    @Autowired
    private UsuarioService usuarioService;

    @PostMapping
    public ResponseEntity<String> registrar(@RequestBody Usuario usuario) {
        try {
            Usuario nuevoUsuario = usuarioService.registrarUsuario(usuario);
            return ResponseEntity.ok("Usuario registrado correctamente con el código: " + nuevoUsuario.getCodigoSocio());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al registrar usuario: " + e.getMessage());
        }
    }

    // GET /api/v1/usuarios/buscar?query=Luis
    @GetMapping("/buscar")
    public ResponseEntity<
            List<UsuarioResumenDTO>> buscarSocios(@RequestParam(required = false) String query) {
        return ResponseEntity.ok(usuarioService.buscarSocios(query));
    }

    // GET /api/v1/usuarios/NAH1997
    @GetMapping("/{codigoSocio}")
    public ResponseEntity<?> obtenerSocio(@PathVariable String codigoSocio) {
        try {
            return ResponseEntity.ok(usuarioService.obtenerPorCodigo(codigoSocio));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET /api/v1/usuarios/por-vencer?dias=5
    @GetMapping("/por-vencer")
    public ResponseEntity<List<UsuarioResumenDTO>> obtenerSociosPorVencer(@RequestParam(defaultValue = "5") int dias) {
        return ResponseEntity.ok(usuarioService.obtenerPorVencer(dias));
    }

    @PutMapping("/{codigoSocio}/estatus-empleado")
    public ResponseEntity<UsuarioResumenDTO> cambiarEstatusEmpleado(@PathVariable String codigoSocio,
                                                                    @RequestParam boolean esEmpleado) {
        return ResponseEntity.ok(usuarioService.cambiarEstatusEmpleado(codigoSocio, esEmpleado));
    }

}
