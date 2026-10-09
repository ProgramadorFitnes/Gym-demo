package com.gym_qa.demo.repository;

import com.gym_qa.demo.dto.HistorialAccesoResponseDTO;
import com.gym_qa.demo.entity.RegistroAcceso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AccesoRepository extends JpaRepository<RegistroAcceso,Long> {

    @Query("SELECT new com.gym_qa.demo.dto.HistorialAccesoResponseDTO(" +
                  "a.fechaAcceso, " +
                  "a.codigoSocio, " +
                  "CONCAT(u.nombre, ' ', u.apellido), " +
                  "CASE WHEN u.esEmpleado = true THEN 'STAFF' ELSE 'MEMBRESIA' END, " +
                  "a.resultado) " +
                  "FROM RegistroAcceso a " +
                  "LEFT JOIN Usuario u ON a.codigoSocio = u.codigoSocio " +
                  "ORDER BY a.fechaAcceso DESC")
    List<HistorialAccesoResponseDTO> obtenerHistorialDTO();

}
