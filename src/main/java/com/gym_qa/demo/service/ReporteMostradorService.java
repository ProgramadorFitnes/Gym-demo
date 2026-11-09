package com.gym_qa.demo.service;

public interface ReporteMostradorService {

    void generarYEnviarReporteMostrador();

    void generarYEnviarReporteMostrador(Integer mes, Integer anio, String correoDestino);

    byte[] generarPdfReporteMostrador(Integer mes, Integer anio);
}
