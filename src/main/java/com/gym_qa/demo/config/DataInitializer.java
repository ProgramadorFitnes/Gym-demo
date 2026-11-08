package com.gym_qa.demo.config;

import com.gym_qa.demo.entity.PlanMembresia;
import com.gym_qa.demo.entity.enums.TipoUnidad;
import com.gym_qa.demo.repository.PlanMembresiaRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initPlanes(PlanMembresiaRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                List<PlanMembresia> defaultPlanes = List.of(
                        PlanMembresia.builder()
                                .nombre("Pase Diario")
                                .precio(new BigDecimal("50.00"))
                                .cantidad(1)
                                .tipoUnidad(TipoUnidad.DIAS)
                                .activo(true)
                                .build(),
                        PlanMembresia.builder()
                                .nombre("Semana")
                                .precio(new BigDecimal("150.00"))
                                .cantidad(7)
                                .tipoUnidad(TipoUnidad.DIAS)
                                .activo(true)
                                .build(),
                        PlanMembresia.builder()
                                .nombre("Mensualidad General")
                                .precio(new BigDecimal("350.00"))
                                .cantidad(1)
                                .tipoUnidad(TipoUnidad.MESES)
                                .activo(true)
                                .build(),
                        PlanMembresia.builder()
                                .nombre("Trimestre")
                                .precio(new BigDecimal("950.00"))
                                .cantidad(3)
                                .tipoUnidad(TipoUnidad.MESES)
                                .activo(true)
                                .build(),
                        PlanMembresia.builder()
                                .nombre("Semestre")
                                .precio(new BigDecimal("1800.00"))
                                .cantidad(6)
                                .tipoUnidad(TipoUnidad.MESES)
                                .activo(true)
                                .build(),
                        PlanMembresia.builder()
                                .nombre("Anualidad")
                                .precio(new BigDecimal("3400.00"))
                                .cantidad(1)
                                .tipoUnidad(TipoUnidad.ANOS)
                                .activo(true)
                                .build()
                );
                repository.saveAll(defaultPlanes);
            }
        };
    }
}
