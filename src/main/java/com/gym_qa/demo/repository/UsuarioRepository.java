package com.gym_qa.demo.repository;

import com.gym_qa.demo.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByCodigoSocio(String codigoSocio);

    Optional<Usuario> findByTelefono(String telefono);

    // Socios con membresía activa (fecha fin igual o posterior a la fecha actual)
    List<Usuario> findByFechaMembresiaFinGreaterThanEqual(LocalDate fecha);

    // Socios con membresía vencida (fecha fin anterior a la fecha actual)
    List<Usuario> findByFechaMembresiaFinLessThan(LocalDate fecha);

    // Socios con membresía por vencer en un rango de fechas (ej. próximos 5 días)
    List<Usuario> findByFechaMembresiaFinBetween(LocalDate inicio, LocalDate fin);

    // Socios vencidos: su fecha de vencimiento es estrictamente menor a hoy
    @Query("SELECT COUNT(u) FROM Usuario u WHERE u.fechaMembresiaFin < :hoy")
    long cuentasVencidas(@Param("hoy") LocalDate hoy);

    // Socios Activos
    @Query("SELECT COUNT(u) FROM Usuario u WHERE u.fechaMembresiaFin >= :hoy ")
    long cuentasActivas(@Param("hoy") LocalDate hoy);

}
