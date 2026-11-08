package com.gym_qa.demo.controller;

import com.gym_qa.demo.entity.PlanMembresia;
import com.gym_qa.demo.repository.PlanMembresiaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/planes")
@CrossOrigin(origins = "*")
public class PlanMembresiaController {

    @Autowired
    private PlanMembresiaRepository planMembresiaRepository;

    @GetMapping
    public ResponseEntity<List<PlanMembresia>> listarPlanes(@RequestParam(required = false, defaultValue = "true") boolean soloActivos) {
        if (soloActivos) {
            return ResponseEntity.ok(planMembresiaRepository.findByActivoTrueOrderByPrecioAsc());
        }
        return ResponseEntity.ok(planMembresiaRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlanMembresia> obtenerPlan(@PathVariable Long id) {
        return planMembresiaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> crearPlan(@RequestBody PlanMembresia plan) {
        try {
            if (plan.getActivo() == null) {
                plan.setActivo(true);
            }
            if (plan.getCantidad() == null || plan.getCantidad() <= 0) {
                plan.setCantidad(1);
            }
            PlanMembresia nuevoPlan = planMembresiaRepository.save(plan);
            return ResponseEntity.ok(nuevoPlan);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al crear plan: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarPlan(@PathVariable Long id, @RequestBody PlanMembresia planDetails) {
        return planMembresiaRepository.findById(id).map(plan -> {
            if (planDetails.getNombre() != null) plan.setNombre(planDetails.getNombre());
            if (planDetails.getPrecio() != null) plan.setPrecio(planDetails.getPrecio());
            if (planDetails.getCantidad() != null) plan.setCantidad(planDetails.getCantidad());
            if (planDetails.getTipoUnidad() != null) plan.setTipoUnidad(planDetails.getTipoUnidad());
            if (planDetails.getActivo() != null) plan.setActivo(planDetails.getActivo());
            PlanMembresia actualizado = planMembresiaRepository.save(plan);
            return ResponseEntity.ok(actualizado);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> desactivarPlan(@PathVariable Long id) {
        return planMembresiaRepository.findById(id).map(plan -> {
            plan.setActivo(false);
            planMembresiaRepository.save(plan);
            return ResponseEntity.ok("Plan desactivado correctamente");
        }).orElse(ResponseEntity.notFound().build());
    }
}
