package com.gym_qa.demo.service.impl;

import com.gym_qa.demo.dto.DetalleVentaResponseDTO;
import com.gym_qa.demo.dto.VentaItemRequestDTO;
import com.gym_qa.demo.dto.VentaRequestDTO;
import com.gym_qa.demo.dto.VentaResponseDTO;
import com.gym_qa.demo.entity.DetalleVenta;
import com.gym_qa.demo.entity.Producto;
import com.gym_qa.demo.entity.Venta;
import com.gym_qa.demo.repository.DetalleVentaRepository;
import com.gym_qa.demo.repository.ProductoRepository;
import com.gym_qa.demo.repository.VentaRepository;
import com.gym_qa.demo.service.PosService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PosServiceImpl implements PosService {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private VentaRepository ventaRepository;

    @Autowired
    private DetalleVentaRepository detalleVentaRepository;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void inicializarProductosPorDefecto() {
        if (productoRepository.count() == 0) {
            List<Producto> iniciales = List.of(
                    Producto.builder().nombre("Agua Ciel 600ml").precio(new BigDecimal("15.00")).stock(40).activo(true).build(),
                    Producto.builder().nombre("Bebida Energética Monster 473ml").precio(new BigDecimal("45.00")).stock(24).activo(true).build(),
                    Producto.builder().nombre("Gatorade Ponche 500ml").precio(new BigDecimal("28.00")).stock(30).activo(true).build(),
                    Producto.builder().nombre("Proteína por porción (Whey)").precio(new BigDecimal("35.00")).stock(50).activo(true).build(),
                    Producto.builder().nombre("Barra de Cereal y Proteína").precio(new BigDecimal("22.00")).stock(35).activo(true).build(),
                    Producto.builder().nombre("Bebida Isotónica Powerade").precio(new BigDecimal("26.00")).stock(25).activo(true).build(),
                    Producto.builder().nombre("Shaker Gym QA 700ml").precio(new BigDecimal("120.00")).stock(15).activo(true).build(),
                    Producto.builder().nombre("Toalla de Microfibra Gym").precio(new BigDecimal("85.00")).stock(12).activo(true).build()
            );
            productoRepository.saveAll(iniciales);
        }
    }

    @Override
    public List<Producto> listarProductos(boolean soloActivos) {
        if (soloActivos) {
            return productoRepository.findByActivoTrueOrderByNombreAsc();
        }
        return productoRepository.findAllByOrderByNombreAsc();
    }

    @Override
    public Producto obtenerProductoPorId(Long id) {
        return productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con ID: " + id));
    }

    @Override
    @Transactional
    public Producto crearProducto(Producto producto) {
        if (producto.getNombre() == null || producto.getNombre().trim().isEmpty()) {
            throw new RuntimeException("El nombre del producto es obligatorio.");
        }
        if (producto.getPrecio() == null || producto.getPrecio().compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("El precio del producto debe ser mayor o igual a 0.");
        }
        if (producto.getStock() == null || producto.getStock() < 0) {
            producto.setStock(0);
        }
        if (producto.getActivo() == null) {
            producto.setActivo(true);
        }
        producto.setNombre(producto.getNombre().trim());
        return productoRepository.save(producto);
    }

    @Override
    @Transactional
    public Producto actualizarProducto(Long id, Producto productoDetails) {
        Producto producto = obtenerProductoPorId(id);
        if (productoDetails.getNombre() != null && !productoDetails.getNombre().trim().isEmpty()) {
            producto.setNombre(productoDetails.getNombre().trim());
        }
        if (productoDetails.getPrecio() != null && productoDetails.getPrecio().compareTo(BigDecimal.ZERO) >= 0) {
            producto.setPrecio(productoDetails.getPrecio());
        }
        if (productoDetails.getStock() != null && productoDetails.getStock() >= 0) {
            producto.setStock(productoDetails.getStock());
        }
        if (productoDetails.getActivo() != null) {
            producto.setActivo(productoDetails.getActivo());
        }
        return productoRepository.save(producto);
    }

    @Override
    @Transactional
    public Producto cambiarEstado(Long id, boolean activo) {
        Producto producto = obtenerProductoPorId(id);
        producto.setActivo(activo);
        return productoRepository.save(producto);
    }

    @Override
    @Transactional
    public Producto actualizarStock(Long id, Integer nuevoStock) {
        if (nuevoStock == null || nuevoStock < 0) {
            throw new RuntimeException("El stock no puede ser un valor negativo.");
        }
        Producto producto = obtenerProductoPorId(id);
        producto.setStock(nuevoStock);
        return productoRepository.save(producto);
    }

    @Override
    @Transactional
    public VentaResponseDTO realizarVenta(VentaRequestDTO request) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            throw new RuntimeException("El carrito de compras no contiene productos para vender.");
        }

        String metodoPago = (request.getMetodoPago() != null && !request.getMetodoPago().trim().isEmpty())
                ? request.getMetodoPago().trim()
                : "Efectivo";

        String responsable = (request.getUsuarioResponsable() != null && !request.getUsuarioResponsable().trim().isEmpty())
                ? request.getUsuarioResponsable().trim()
                : "Recepcionista";

        BigDecimal total = BigDecimal.ZERO;
        List<DetalleVenta> detallesParaGuardar = new ArrayList<>();
        List<DetalleVentaResponseDTO> detallesResponse = new ArrayList<>();

        Venta venta = Venta.builder()
                .fechaHora(LocalDateTime.now())
                .total(BigDecimal.ZERO)
                .metodoPago(metodoPago)
                .usuarioResponsable(responsable)
                .build();

        for (VentaItemRequestDTO item : request.getItems()) {
            if (item.getProductoId() == null) {
                throw new RuntimeException("El ID del producto es requerido en los elementos del carrito.");
            }
            int cantidadSolicitada = (item.getCantidad() != null && item.getCantidad() > 0) ? item.getCantidad() : 1;

            Producto producto = productoRepository.findById(item.getProductoId())
                    .orElseThrow(() -> new RuntimeException("Producto con ID " + item.getProductoId() + " no encontrado."));

            if (Boolean.FALSE.equals(producto.getActivo())) {
                throw new RuntimeException("El producto '" + producto.getNombre() + "' se encuentra inactivo y no puede ser vendido.");
            }

            // Verificación estricta de stock
            if (producto.getStock() < cantidadSolicitada) {
                throw new RuntimeException("Stock insuficiente para '" + producto.getNombre() + "'. Stock disponible: "
                        + producto.getStock() + ", solicitado: " + cantidadSolicitada);
            }

            // Descontar automáticamente el stock
            producto.setStock(producto.getStock() - cantidadSolicitada);
            productoRepository.save(producto);

            // Calcular subtotal
            BigDecimal precioUnitario = producto.getPrecio();
            BigDecimal subtotal = precioUnitario.multiply(BigDecimal.valueOf(cantidadSolicitada));
            total = total.add(subtotal);

            DetalleVenta detalle = DetalleVenta.builder()
                    .venta(venta)
                    .producto(producto)
                    .cantidad(cantidadSolicitada)
                    .precioUnitario(precioUnitario)
                    .subtotal(subtotal)
                    .build();

            detallesParaGuardar.add(detalle);

            detallesResponse.add(DetalleVentaResponseDTO.builder()
                    .productoId(producto.getId())
                    .productoNombre(producto.getNombre())
                    .cantidad(cantidadSolicitada)
                    .precioUnitario(precioUnitario)
                    .subtotal(subtotal)
                    .build());
        }

        venta.setTotal(total);
        venta.setDetalles(detallesParaGuardar);
        Venta ventaGuardada = ventaRepository.save(venta);

        for (int i = 0; i < detallesParaGuardar.size(); i++) {
            detallesResponse.get(i).setId(detallesParaGuardar.get(i).getId());
        }

        return VentaResponseDTO.builder()
                .id(ventaGuardada.getId())
                .folio(ventaGuardada.getId())
                .fechaHora(ventaGuardada.getFechaHora())
                .total(ventaGuardada.getTotal())
                .metodoPago(ventaGuardada.getMetodoPago())
                .usuarioResponsable(ventaGuardada.getUsuarioResponsable())
                .detalles(detallesResponse)
                .mensaje("Venta procesada exitosamente.")
                .build();
    }

    @Override
    public List<VentaResponseDTO> listarVentasRecientes() {
        return ventaRepository.findAllByOrderByFechaHoraDesc().stream()
                .limit(50)
                .map(this::convertirAVentaResponseDTO)
                .collect(Collectors.toList());
    }

    private VentaResponseDTO convertirAVentaResponseDTO(Venta v) {
        List<DetalleVentaResponseDTO> detallesDTO = (v.getDetalles() != null)
                ? v.getDetalles().stream().map(d -> DetalleVentaResponseDTO.builder()
                .id(d.getId())
                .productoId(d.getProducto() != null ? d.getProducto().getId() : null)
                .productoNombre(d.getProducto() != null ? d.getProducto().getNombre() : "Producto")
                .cantidad(d.getCantidad())
                .precioUnitario(d.getPrecioUnitario())
                .subtotal(d.getSubtotal())
                .build()).collect(Collectors.toList())
                : new ArrayList<>();

        return VentaResponseDTO.builder()
                .id(v.getId())
                .folio(v.getId())
                .fechaHora(v.getFechaHora())
                .total(v.getTotal())
                .metodoPago(v.getMetodoPago())
                .usuarioResponsable(v.getUsuarioResponsable())
                .detalles(detallesDTO)
                .build();
    }
}
