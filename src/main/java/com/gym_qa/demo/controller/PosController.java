package com.gym_qa.demo.controller;

import com.gym_qa.demo.dto.VentaRequestDTO;
import com.gym_qa.demo.dto.VentaResponseDTO;
import com.gym_qa.demo.entity.Producto;
import com.gym_qa.demo.service.PosService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/pos")
@CrossOrigin(origins = "*")
public class PosController {

    @Autowired
    private PosService posService;

    @GetMapping("/productos")
    public ResponseEntity<List<Producto>> listarProductos(
            @RequestParam(required = false, defaultValue = "true") boolean soloActivos) {
        return ResponseEntity.ok(posService.listarProductos(soloActivos));
    }

    @GetMapping("/productos/{id}")
    public ResponseEntity<Producto> obtenerProducto(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(posService.obtenerProductoPorId(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/productos")
    public ResponseEntity<?> crearProducto(@RequestBody Producto producto) {
        try {
            Producto nuevo = posService.crearProducto(producto);
            return ResponseEntity.ok(nuevo);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al crear producto: " + e.getMessage());
        }
    }

    @PutMapping("/productos/{id}")
    public ResponseEntity<?> actualizarProducto(@PathVariable Long id, @RequestBody Producto producto) {
        try {
            Producto actualizado = posService.actualizarProducto(id, producto);
            return ResponseEntity.ok(actualizado);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al actualizar producto: " + e.getMessage());
        }
    }

    @PutMapping("/productos/{id}/estado")
    public ResponseEntity<?> cambiarEstado(@PathVariable Long id, @RequestParam boolean activo) {
        try {
            Producto actualizado = posService.cambiarEstado(id, activo);
            return ResponseEntity.ok(actualizado);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/productos/{id}/stock")
    public ResponseEntity<?> actualizarStock(@PathVariable Long id, @RequestParam Integer cantidad) {
        try {
            Producto actualizado = posService.actualizarStock(id, cantidad);
            return ResponseEntity.ok(actualizado);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/vender")
    public ResponseEntity<?> vender(@RequestBody VentaRequestDTO request) {
        try {
            VentaResponseDTO venta = posService.realizarVenta(request);
            return ResponseEntity.ok(venta);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al procesar la venta: " + e.getMessage());
        }
    }

    @GetMapping("/ventas")
    public ResponseEntity<List<VentaResponseDTO>> listarVentas() {
        return ResponseEntity.ok(posService.listarVentasRecientes());
    }
}
