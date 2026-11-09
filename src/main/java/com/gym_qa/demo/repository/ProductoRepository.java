package com.gym_qa.demo.repository;

import com.gym_qa.demo.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    List<Producto> findByActivoTrueOrderByNombreAsc();
    List<Producto> findAllByOrderByNombreAsc();
    List<Producto> findByNombreContainingIgnoreCase(String nombre);
}
