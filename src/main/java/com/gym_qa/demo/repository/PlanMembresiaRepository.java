package com.gym_qa.demo.repository;

import com.gym_qa.demo.entity.PlanMembresia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlanMembresiaRepository extends JpaRepository<PlanMembresia, Long> {
    List<PlanMembresia> findByActivoTrue();
    List<PlanMembresia> findByActivoTrueOrderByPrecioAsc();
}
