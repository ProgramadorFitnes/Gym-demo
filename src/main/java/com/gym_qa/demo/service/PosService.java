package com.gym_qa.demo.service;

import com.gym_qa.demo.dto.VentaRequestDTO;
import com.gym_qa.demo.dto.VentaResponseDTO;
import com.gym_qa.demo.entity.Producto;

import java.util.List;

public interface PosService {
    List<Producto> listarProductos(boolean soloActivos);
    Producto obtenerProductoPorId(Long id);
    Producto crearProducto(Producto producto);
    Producto actualizarProducto(Long id, Producto producto);
    Producto cambiarEstado(Long id, boolean activo);
    Producto actualizarStock(Long id, Integer nuevoStock);
    VentaResponseDTO realizarVenta(VentaRequestDTO request);
    List<VentaResponseDTO> listarVentasRecientes();
}
