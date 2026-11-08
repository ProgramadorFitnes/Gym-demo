// Instancias de Chart.js para evitar conflictos de canvas duplicados
let chartIngresosInstance = null;
let chartHorariosInstance = null;
let chartMembresiasInstance = null;
let chartMetodosInstance = null;
let chartDistribucionInstance = null;

// Catálogo de Planes en memoria
let planesDisponibles = [];

// Cache de Resumen de Caja del Día actual
let resumenCajaHoyCache = null;

document.addEventListener('DOMContentLoaded', () => {
    // Fecha en la cabecera
    const fechaElem = document.getElementById('fecha-actual');
    if (fechaElem) {
        fechaElem.innerText = new Date().toLocaleDateString('es-MX', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    // Cargas iniciales de datos
    cargarPlanes();
    cargarDashboard();
    cargarGraficas();
    cargarSocios();

    // Eventos de Navegación Sidebar
    document.querySelectorAll('aside nav button[data-section]').forEach(btn => {
        btn.addEventListener('click', (e) => cambiarSeccion(e.currentTarget.dataset.section));
    });

    // Detectar hash en URL si existe (ej. index.html#corte)
    const hash = window.location.hash.replace('#', '');
    if (['dashboard', 'pagos', 'corte', 'registro', 'accesos'].includes(hash)) {
        cambiarSeccion(hash);
    }

    // Buscador en tiempo real de socios
    const inputBusqueda = document.getElementById('input-busqueda');
    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', (e) => {
            cargarSocios(e.target.value.trim());
        });
    }

    // Formulario de Pago
    const formPago = document.getElementById('form-pago');
    if (formPago) {
        formPago.addEventListener('submit', manejarFormularioPago);
    }

    // Formulario Registro de Nuevo Socio
    const formRegistro = document.getElementById('formRegistro');
    if (formRegistro) {
        formRegistro.addEventListener('submit', manejarRegistro);
    }

    const chkEmpleado = document.getElementById('esEmpleado');
    if (chkEmpleado) {
        chkEmpleado.addEventListener('change', alternarSeccionPago);
    }

    // Formulario Check-in
    const formCheckin = document.getElementById('form-checkin');
    if (formCheckin) {
        formCheckin.addEventListener('submit', manejarCheckin);
    }

    // Botones de Refresco de Secciones
    const btnRefrescarAccesos = document.getElementById('btn-refrescar-accesos');
    if (btnRefrescarAccesos) {
        btnRefrescarAccesos.addEventListener('click', cargarAccesos);
    }

    const btnRefrescarGraficas = document.getElementById('btn-refrescar-graficas');
    if (btnRefrescarGraficas) {
        btnRefrescarGraficas.addEventListener('click', () => {
            const icon = btnRefrescarGraficas.querySelector('i');
            if (icon) icon.classList.add('fa-spin');
            cargarGraficas().finally(() => {
                if (icon) setTimeout(() => icon.classList.remove('fa-spin'), 600);
            });
        });
    }

    // Eventos para Corte de Caja
    const btnRefrescarCaja = document.getElementById('btn-refrescar-caja');
    if (btnRefrescarCaja) {
        btnRefrescarCaja.addEventListener('click', cargarCorteCaja);
    }

    const btnImprimirCorteHoy = document.getElementById('btn-imprimir-corte-hoy');
    if (btnImprimirCorteHoy) {
        btnImprimirCorteHoy.addEventListener('click', imprimirCorteCaja);
    }

    const formCorteCaja = document.getElementById('form-corte-caja');
    if (formCorteCaja) {
        formCorteCaja.addEventListener('submit', manejarGuardarCorte);
    }

    const btnRefrescarHistorialCortes = document.getElementById('btn-refrescar-historial-cortes');
    if (btnRefrescarHistorialCortes) {
        btnRefrescarHistorialCortes.addEventListener('click', cargarHistorialCortes);
    }

    // Inputs dinámicos para recalcular Arqueo de Caja en vivo
    const inputFondoInicial = document.getElementById('corte-fondo-inicial');
    const inputEfectivoReal = document.getElementById('corte-efectivo-real');
    if (inputFondoInicial) inputFondoInicial.addEventListener('input', recalcularArqueoCaja);
    if (inputEfectivoReal) inputEfectivoReal.addEventListener('input', recalcularArqueoCaja);

    // Modal Planes
    const btnAbrirModalPlanes = document.getElementById('btn-abrir-modal-planes');
    if (btnAbrirModalPlanes) {
        btnAbrirModalPlanes.addEventListener('click', abrirModalPlanes);
    }

    const formCrearPlan = document.getElementById('form-crear-plan');
    if (formCrearPlan) {
        formCrearPlan.addEventListener('submit', manejarCrearPlan);
    }
});

// Control de Secciones de la Interfaz (SPA con Sidebar Persistente)
function cambiarSeccion(seccion) {
    const vistaDashboard = document.getElementById('vista-dashboard');
    const vistaPagos = document.getElementById('vista-pagos');
    const vistaCorte = document.getElementById('vista-corte');
    const vistaRegistro = document.getElementById('vista-registro');
    const vistaAccesos = document.getElementById('vista-accesos');

    const btnDashboard = document.getElementById('btn-nav-dashboard');
    const btnPagos = document.getElementById('btn-nav-pagos');
    const btnCorte = document.getElementById('btn-nav-corte');
    const btnRegistro = document.getElementById('btn-nav-registro');
    const btnAccesos = document.getElementById('btn-nav-accesos');
    const tituloSeccion = document.getElementById('titulo-seccion');

    const estiloActivo = 'w-full text-left px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-3 bg-indigo-800 text-white shadow-sm transition';
    const estiloInactivo = 'w-full text-left px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-3 hover:bg-indigo-800/60 text-indigo-200 hover:text-white transition';

    // Ocultar todas las secciones
    if (vistaDashboard) vistaDashboard.classList.add('hidden');
    if (vistaPagos) vistaPagos.classList.add('hidden');
    if (vistaCorte) vistaCorte.classList.add('hidden');
    if (vistaRegistro) vistaRegistro.classList.add('hidden');
    if (vistaAccesos) vistaAccesos.classList.add('hidden');

    // Desactivar botones de navegación
    if (btnDashboard) btnDashboard.className = estiloInactivo;
    if (btnPagos) btnPagos.className = estiloInactivo;
    if (btnCorte) btnCorte.className = estiloInactivo;
    if (btnRegistro) btnRegistro.className = estiloInactivo;
    if (btnAccesos) btnAccesos.className = estiloInactivo;

    if (seccion === 'dashboard') {
        if (vistaDashboard) vistaDashboard.classList.remove('hidden');
        if (btnDashboard) btnDashboard.className = estiloActivo;
        if (tituloSeccion) tituloSeccion.innerText = 'Dashboard y Analíticas';
        window.location.hash = 'dashboard';
        cargarDashboard();
        cargarGraficas();
    } else if (seccion === 'pagos') {
        if (vistaPagos) vistaPagos.classList.remove('hidden');
        if (btnPagos) btnPagos.className = estiloActivo;
        if (tituloSeccion) tituloSeccion.innerText = 'Cobros y Gestión de Membresías';
        window.location.hash = 'pagos';
        cargarPlanes();
        cargarSocios();
    } else if (seccion === 'corte') {
        if (vistaCorte) vistaCorte.classList.remove('hidden');
        if (btnCorte) btnCorte.className = estiloActivo;
        if (tituloSeccion) tituloSeccion.innerText = 'Corte de Caja Diario (Arqueo)';
        window.location.hash = 'corte';
        cargarCorteCaja();
    } else if (seccion === 'registro') {
        if (vistaRegistro) vistaRegistro.classList.remove('hidden');
        if (btnRegistro) btnRegistro.className = estiloActivo;
        if (tituloSeccion) tituloSeccion.innerText = 'Alta de Nuevo Socio';
        window.location.hash = 'registro';
        cargarPlanes();
        const inputCodigo = document.getElementById('codigoSocio');
        if (inputCodigo) setTimeout(() => inputCodigo.focus(), 100);
    } else if (seccion === 'accesos') {
        if (vistaAccesos) vistaAccesos.classList.remove('hidden');
        if (btnAccesos) btnAccesos.className = estiloActivo;
        if (tituloSeccion) tituloSeccion.innerText = 'Monitoreo de Accesos / Entrada';
        window.location.hash = 'accesos';
        cargarAccesos();
    }
}

// ==========================================
// GESTIÓN DE PLANES Y MULTIPLICADOR DE CANTIDAD
// ==========================================
async function cargarPlanes() {
    try {
        planesDisponibles = await ApiService.getPlanes(true);
        poblarSelectPlanes('select-planes', 'pago-cantidad', 'pago-precio-display', 'info-duracion-plan');
        poblarSelectPlanes('select-planes-registro', 'registro-cantidad', 'registro-precio-display', 'info-duracion-registro');
    } catch (err) {
        console.error('Error al cargar planes de membresía:', err);
    }
}

function formatearUnidad(cantidad, tipoUnidad) {
    const unidad = (tipoUnidad || 'MESES').toUpperCase();
    if (unidad === 'DIAS') return cantidad === 1 ? 'día' : 'días';
    if (unidad === 'ANOS' || unidad === 'AÑOS') return cantidad === 1 ? 'año' : 'años';
    return cantidad === 1 ? 'mes' : 'meses';
}

function poblarSelectPlanes(selectId, cantidadId, priceDisplayId, durationDisplayId) {
    const select = document.getElementById(selectId);
    const inputCant = document.getElementById(cantidadId);
    if (!select) return;

    const valorPrevio = select.value;
    select.innerHTML = '<option value="" disabled selected>Selecciona un plan de membresía...</option>';

    if (!planesDisponibles || planesDisponibles.length === 0) {
        select.innerHTML = '<option value="" disabled selected>No hay planes disponibles</option>';
        actualizarPrecioDisplay(selectId, cantidadId, priceDisplayId, durationDisplayId);
        return;
    }

    planesDisponibles.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        const duracionTxt = `${p.cantidad} ${formatearUnidad(p.cantidad, p.tipoUnidad)}`;
        opt.textContent = `${p.nombre} (${duracionTxt}) — $${Number(p.precio).toFixed(2)}`;
        select.appendChild(opt);
    });

    const recalcular = () => actualizarPrecioDisplay(selectId, cantidadId, priceDisplayId, durationDisplayId);

    select.onchange = recalcular;
    if (inputCant) {
        inputCant.oninput = recalcular;
        inputCant.onchange = recalcular;
    }

    const existePrevio = valorPrevio && planesDisponibles.some(p => String(p.id) === String(valorPrevio));
    if (existePrevio) {
        select.value = valorPrevio;
        recalcular();
    } else if (select.options.length > 1) {
        select.selectedIndex = 1;
        recalcular();
    }
}

function actualizarPrecioDisplay(selectId, cantidadId, priceDisplayId, durationDisplayId) {
    const select = document.getElementById(selectId);
    const inputCant = document.getElementById(cantidadId);
    const priceDisplay = document.getElementById(priceDisplayId);
    const durationDisplay = document.getElementById(durationDisplayId);

    if (!select || !priceDisplay) return;

    const planId = select.value;
    const plan = planesDisponibles.find(p => String(p.id) === String(planId));
    let cantidad = 1;
    if (inputCant) {
        cantidad = parseInt(inputCant.value, 10);
        if (isNaN(cantidad) || cantidad < 1) cantidad = 1;
    }

    if (plan) {
        const total = Number(plan.precio) * cantidad;
        priceDisplay.innerText = `$${total.toFixed(2)}`;

        if (durationDisplay) {
            const duracionTotal = plan.cantidad * cantidad;
            const unidadTxt = formatearUnidad(duracionTotal, plan.tipoUnidad);
            if (cantidad > 1) {
                durationDisplay.innerText = `${cantidad}x (${plan.cantidad} ${formatearUnidad(plan.cantidad, plan.tipoUnidad)}) = ${duracionTotal} ${unidadTxt} en total`;
            } else {
                durationDisplay.innerText = `Vigencia: ${duracionTotal} ${unidadTxt}`;
            }
        }
    } else {
        priceDisplay.innerText = '$0.00';
        if (durationDisplay) {
            durationDisplay.innerText = 'Selecciona un plan para ver duración';
        }
    }
}

// ==========================================
// MODAL CRUD DE PLANES DE MEMBRESÍA
// ==========================================
function abrirModalPlanes() {
    const modal = document.getElementById('modal-planes');
    if (modal) {
        modal.classList.remove('hidden');
        cargarTablaModalPlanes();
    }
}

function cerrarModalPlanes() {
    const modal = document.getElementById('modal-planes');
    if (modal) modal.classList.add('hidden');
}

async function cargarTablaModalPlanes() {
    const tbody = document.getElementById('tabla-modal-planes-body');
    if (!tbody) return;

    try {
        const planes = await ApiService.getPlanes(false);
        tbody.innerHTML = '';

        if (!planes || planes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="p-3 text-center text-gray-400">No hay planes registrados</td></tr>';
            return;
        }

        planes.forEach(p => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50';
            const duracion = `${p.cantidad} ${formatearUnidad(p.cantidad, p.tipoUnidad)}`;
            const estadoBadge = p.activo
                ? '<span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-green-100 text-green-800">Activo</span>'
                : '<span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-600">Inactivo</span>';

            const accionBtn = p.activo
                ? `<button onclick="cambiarEstadoPlan(${p.id}, false)" class="text-xs text-red-600 hover:text-red-800 font-semibold px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 transition"><i class="fa-solid fa-toggle-on me-1"></i>Desactivar</button>`
                : `<button onclick="cambiarEstadoPlan(${p.id}, true)" class="text-xs text-emerald-700 hover:text-emerald-900 font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition"><i class="fa-solid fa-toggle-off me-1"></i>Activar</button>`;

            tr.innerHTML = `
                <td class="p-2.5 font-medium text-gray-800">${p.nombre}</td>
                <td class="p-2.5 text-gray-600 font-mono">${duracion}</td>
                <td class="p-2.5 font-bold text-indigo-600 font-mono">$${Number(p.precio).toFixed(2)}</td>
                <td class="p-2.5">${estadoBadge}</td>
                <td class="p-2.5 text-right">${accionBtn}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-3 text-center text-red-500">Error al cargar planes</td></tr>';
    }
}

async function manejarCrearPlan(e) {
    e.preventDefault();
    const msg = document.getElementById('modal-plan-mensaje');
    const nombre = document.getElementById('nuevo-plan-nombre').value.trim();
    const precio = parseFloat(document.getElementById('nuevo-plan-precio').value);
    const cantidad = parseInt(document.getElementById('nuevo-plan-cantidad').value, 10);
    const tipoUnidad = document.getElementById('nuevo-plan-unidad').value;

    if (!nombre || isNaN(precio) || precio <= 0 || isNaN(cantidad) || cantidad <= 0) {
        if (msg) {
            msg.className = 'text-xs p-2 rounded text-center font-medium bg-red-100 text-red-700 block';
            msg.innerText = 'Por favor completa todos los campos con valores válidos.';
        }
        return;
    }

    try {
        await ApiService.crearPlan({
            nombre,
            precio,
            cantidad,
            tipoUnidad,
            activo: true
        });

        if (msg) {
            msg.className = 'text-xs p-2 rounded text-center font-medium bg-green-100 text-green-700 block';
            msg.innerText = 'Plan creado exitosamente.';
            setTimeout(() => msg.classList.add('hidden'), 2500);
        }

        document.getElementById('form-crear-plan').reset();
        document.getElementById('nuevo-plan-cantidad').value = '1';

        await cargarPlanes();
        await cargarTablaModalPlanes();
        renderGraficaDistribucionPlanes();
    } catch (err) {
        if (msg) {
            msg.className = 'text-xs p-2 rounded text-center font-medium bg-red-100 text-red-700 block';
            msg.innerText = `Error: ${err.message}`;
        }
    }
}

async function cambiarEstadoPlan(id, nuevoEstado) {
    const accionTexto = nuevoEstado ? 'activar' : 'desactivar';
    if (!confirm(`¿Estás seguro de que deseas ${accionTexto} este plan de membresía?`)) return;
    try {
        await ApiService.cambiarEstadoPlan(id, nuevoEstado);
        await cargarPlanes();
        await cargarTablaModalPlanes();
    } catch (err) {
        alert(`Error al ${accionTexto} el plan: ${err.message}`);
    }
}

async function desactivarPlan(id) {
    return cambiarEstadoPlan(id, false);
}

// ==========================================
// DASHBOARD GENERAL Y KPIS
// ==========================================
async function cargarDashboard() {
    try {
        const resumen = await ApiService.getResumenDashboard();
        if (resumen) {
            const activos = resumen.sociosActivos !== undefined ? resumen.sociosActivos : (resumen.totalSociosActivos !== undefined ? resumen.totalSociosActivos : 0);
            const vencidos = resumen.sociosVencidos !== undefined ? resumen.sociosVencidos : (resumen.totalSociosVencidos !== undefined ? resumen.totalSociosVencidos : 0);
            const porVencer = resumen.sociosPorVencer !== undefined ? resumen.sociosPorVencer : 0;
            const ingresos = Number(resumen.ingresosDelMes !== undefined ? resumen.ingresosDelMes : (resumen.ingresosMesActual !== undefined ? resumen.ingresosMesActual : 0)) || 0;

            const elActivos = document.getElementById('metric-activos');
            const elVencidos = document.getElementById('metric-vencidos');
            const elPorVencer = document.getElementById('metric-por-vencer');
            const elIngresos = document.getElementById('metric-ingresos');

            if (elActivos) elActivos.innerText = activos;
            if (elVencidos) elVencidos.innerText = vencidos;
            if (elPorVencer) elPorVencer.innerText = porVencer;
            if (elIngresos) elIngresos.innerText = `$${ingresos.toLocaleString('es-MX', {
                minimumFractionDigits: 2, maximumFractionDigits: 2
            })}`;
        }
    } catch (error) {
        console.error('Error cargando métricas:', error);
    }
}

// ==========================================
// SOCIOS Y REGISTRO DE PAGOS
// ==========================================
async function cargarSocios(query = '') {
    const tbody = document.getElementById('tabla-busqueda-body');
    if (!tbody) return;

    try {
        const socios = await ApiService.buscarSocios(query);
        tbody.innerHTML = '';

        if (!socios || socios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gray-500">No se encontraron socios.</td></tr>';
            return;
        }

        socios.forEach(s => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50 transition border-b border-gray-100';

            // Nombre completo blindado contra valores nulos o "undefined"
            const nom = (s.nombre && s.nombre !== 'undefined') ? s.nombre.trim() : '';
            const ape = (s.apellido && s.apellido !== 'undefined') ? s.apellido.trim() : '';
            const nombreCompleto = (nom && ape) ? `${nom} ${ape}` : (nom || ape || 'Socio');

            // Determinar si está activo de forma tolerante a fallos
            let esActivo = false;
            if (typeof s.activo === 'boolean') {
                esActivo = s.activo;
            } else if (s.estadoMembresia && s.estadoMembresia !== 'undefined') {
                esActivo = s.estadoMembresia.toUpperCase() === 'ACTIVA';
            } else if (s.fechaMembresiaFin) {
                const fin = new Date(s.fechaMembresiaFin + 'T23:59:59');
                esActivo = !isNaN(fin.getTime()) && fin >= new Date();
            }

            const estadoTexto = (s.estadoMembresia && s.estadoMembresia !== 'undefined')
                ? s.estadoMembresia
                : (esActivo ? 'ACTIVA' : 'VENCIDA');

            const badgeClase = esActivo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
            const codigo = s.codigoSocio || s.codigoUsuario || (s.id ? String(s.id) : '---');
            const telefono = (s.telefono && s.telefono !== 'undefined') ? s.telefono : 'S/N';
            const vigencia = (s.fechaMembresiaFin && s.fechaMembresiaFin !== 'undefined') ? s.fechaMembresiaFin : 'Sin vigencia';

            tr.innerHTML = `
                <td class="p-3 font-mono font-bold text-indigo-600">${codigo}</td>
                <td class="p-3 font-medium text-gray-800">${nombreCompleto}</td>
                <td class="p-3 text-gray-500">${telefono}</td>
                <td class="p-3 font-mono text-xs">${vigencia}</td>
                <td class="p-3">
                    <span class="px-2.5 py-1 text-[10px] font-bold rounded-full uppercase ${badgeClase}">
                        ${estadoTexto}
                    </span>
                </td>
                <td class="p-3">
                    <button onclick="seleccionarSocio('${codigo}')" 
                            class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-1 rounded text-xs transition border border-indigo-200">
                        Cobrar
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-red-500">Error al consultar los socios.</td></tr>';
    }
}

function seleccionarSocio(codigo) {
    const inputPagoCodigo = document.getElementById('pago-codigo');
    if (inputPagoCodigo) {
        inputPagoCodigo.value = codigo;
        inputPagoCodigo.focus();
    }
}

// Formulario de Pago
async function manejarFormularioPago(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-procesar-pago');
    const msg = document.getElementById('pago-mensaje');

    const codigoSocio = document.getElementById('pago-codigo').value.trim();
    const selectPlan = document.getElementById('select-planes');
    const planMembresiaId = selectPlan ? selectPlan.value : null;
    const metodoPago = document.getElementById('pago-metodo').value;
    const inputCantidad = document.getElementById('pago-cantidad');
    const cantidad = inputCantidad ? parseInt(inputCantidad.value, 10) : 1;

    if (!codigoSocio || !planMembresiaId) {
        msg.className = 'mt-3 p-3 text-xs rounded-lg text-center font-medium bg-red-100 text-red-700 block';
        msg.innerText = 'Por favor ingresa el código del socio y selecciona un plan de membresía válido.';
        return;
    }

    if (isNaN(cantidad) || cantidad < 1) {
        msg.className = 'mt-3 p-3 text-xs rounded-lg text-center font-medium bg-red-100 text-red-700 block';
        msg.innerText = 'La cantidad debe ser un número entero mayor o igual a 1.';
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando Cobro...';

    const planSeleccionado = planesDisponibles.find(p => String(p.id) === String(planMembresiaId));
    const montoCalculado = planSeleccionado ? (Number(planSeleccionado.precio) * cantidad) : 0;

    try {
        const respuesta = await ApiService.registrarPago({
            codigoSocio,
            planMembresiaId: Number(planMembresiaId),
            cantidad,
            metodoPago
        });

        msg.className = 'mt-3 p-3 text-xs rounded-lg text-center font-medium bg-green-100 text-green-700 block';
        const duracionTotal = planSeleccionado ? `${planSeleccionado.cantidad * cantidad} ${formatearUnidad(planSeleccionado.cantidad * cantidad, planSeleccionado.tipoUnidad)}` : 'Membresía';
        msg.innerText = `Pago de ${duracionTotal} registrado exitosamente. Se emitió comprobante.`;

        // Imprimir Ticket de Pago
        TicketPrinter.imprimir({
            folio: respuesta.folio || respuesta.id || Math.floor(100000 + Math.random() * 900000),
            codigoSocio: codigoSocio,
            nombreSocio: respuesta.nombreSocio || respuesta.nombreUsuario || codigoSocio,
            nombrePlan: planSeleccionado ? `${planSeleccionado.nombre} (${cantidad > 1 ? cantidad + 'x ' : ''}${duracionTotal})` : 'Membresía',
            monto: respuesta.monto || montoCalculado,
            metodoPago: metodoPago,
            fechaMembresiaFin: respuesta.fechaMembresiaFin || respuesta.nuevaFechaFin || 'Actualizada'
        });

        document.getElementById('form-pago').reset();
        if (inputCantidad) inputCantidad.value = '1';
        if (selectPlan && selectPlan.options.length > 1) {
            selectPlan.selectedIndex = 1;
            actualizarPrecioDisplay('select-planes', 'pago-cantidad', 'pago-precio-display', 'info-duracion-plan');
        }

        await cargarDashboard();
        await cargarSocios();
        cargarGraficas();
    } catch (err) {
        msg.className = 'mt-3 p-3 text-xs rounded-lg text-center font-medium bg-red-100 text-red-700 block';
        msg.innerText = `Error al registrar pago: ${err.message}`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-receipt"></i> Procesar Pago';
    }
}

// Formulario Alta de Socio
function alternarSeccionPago() {
    const esEmpleado = document.getElementById('esEmpleado').checked;
    const seccionPago = document.getElementById('seccionPago');
    if (seccionPago) {
        seccionPago.style.display = esEmpleado ? 'none' : 'block';
    }
}

async function manejarRegistro(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById('btnSubmit');
    const respuesta = document.getElementById('respuesta');

    const codigoSocio = document.getElementById('codigoSocio').value.trim();
    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const esEmpleado = document.getElementById('esEmpleado').checked;

    const selectPlanRegistro = document.getElementById('select-planes-registro');
    const planMembresiaId = selectPlanRegistro ? selectPlanRegistro.value : null;
    const inputCantidadRegistro = document.getElementById('registro-cantidad');
    const cantidadRegistro = inputCantidadRegistro ? parseInt(inputCantidadRegistro.value, 10) : 1;
    const metodoPago = document.getElementById('metodoPago').value;

    if (!esEmpleado && !planMembresiaId) {
        respuesta.className = 'mt-3 p-3 rounded-lg text-xs font-medium text-center bg-red-100 text-red-700 block';
        respuesta.innerText = 'Debes seleccionar un plan de membresía inicial para el nuevo socio.';
        return;
    }

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registrando Socio...';

    const planSeleccionado = planesDisponibles.find(p => String(p.id) === String(planMembresiaId));
    const montoCalculado = planSeleccionado ? (Number(planSeleccionado.precio) * cantidadRegistro) : 0;

    const payload = {
        codigoSocio,
        nombre,
        apellido,
        telefono,
        correo,
        esEmpleado,
        tipo: esEmpleado ? 'EMPLEADO' : 'SOCIO',
        planMembresiaId: esEmpleado ? null : Number(planMembresiaId),
        cantidad: esEmpleado ? 1 : cantidadRegistro,
        metodoPago: esEmpleado ? null : metodoPago
    };

    try {
        const usuarioCreado = await ApiService.crearUsuario(payload);

        let pagoCreado = null;
        // Si es un socio con cobro inicial, registrar automáticamente el pago en el sistema
        if (!esEmpleado && planMembresiaId) {
            pagoCreado = await ApiService.registrarPago({
                codigoSocio: codigoSocio,
                planMembresiaId: Number(planMembresiaId),
                cantidad: cantidadRegistro,
                metodoPago: metodoPago
            });
        }

        respuesta.className = 'mt-3 p-3 rounded-lg text-xs font-medium text-center bg-green-100 text-green-700 block';
        respuesta.innerText = `¡Socio ${nombre} registrado y cobrado con éxito! Folio/PIN: ${codigoSocio}`;

        // Si fue socio con cobro, imprimir ticket
        if (!esEmpleado) {
            const duracionTotal = planSeleccionado ? `${planSeleccionado.cantidad * cantidadRegistro} ${formatearUnidad(planSeleccionado.cantidad * cantidadRegistro, planSeleccionado.tipoUnidad)}` : 'Membresía Inicial';
            TicketPrinter.imprimir({
                folio: pagoCreado ? (pagoCreado.folio || pagoCreado.id) : Math.floor(100000 + Math.random() * 900000),
                codigoSocio: codigoSocio,
                nombreSocio: `${nombre} ${apellido}`,
                nombrePlan: planSeleccionado ? `${planSeleccionado.nombre} (${cantidadRegistro > 1 ? cantidadRegistro + 'x ' : ''}${duracionTotal})` : 'Membresía Inicial',
                monto: pagoCreado ? pagoCreado.monto : (usuarioCreado.montoPagado || montoCalculado),
                metodoPago: metodoPago,
                fechaMembresiaFin: (pagoCreado && pagoCreado.fechaMembresiaFin) || usuarioCreado.fechaMembresiaFin || 'Vigencia inicial asignada'
            });
        }

        document.getElementById('formRegistro').reset();
        document.getElementById('esEmpleado').checked = false;
        alternarSeccionPago();
        if (inputCantidadRegistro) inputCantidadRegistro.value = '1';
        if (selectPlanRegistro && selectPlanRegistro.options.length > 1) {
            selectPlanRegistro.selectedIndex = 1;
            actualizarPrecioDisplay('select-planes-registro', 'registro-cantidad', 'registro-precio-display', 'info-duracion-registro');
        }

        await cargarDashboard();
        await cargarSocios();
        cargarGraficas();
        if (typeof cargarCorteCaja === 'function') {
            cargarCorteCaja();
        }
    } catch (err) {
        respuesta.className = 'mt-3 p-3 rounded-lg text-xs font-medium text-center bg-red-100 text-red-700 block';
        respuesta.innerText = `Error: ${err.message}`;
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Registrar y Cobrar';
    }
}

// ==========================================
// CHECK-IN Y CONTROL DE ACCESO
// ==========================================
async function manejarCheckin(e) {
    e.preventDefault();
    const inputCodigo = document.getElementById('input-checkin-codigo');
    const msg = document.getElementById('checkin-mensaje');
    const codigoSocio = inputCodigo.value.trim();

    if (!codigoSocio) return;

    msg.className = 'mt-3 p-3 text-sm rounded-lg font-medium text-center bg-blue-100 text-blue-700 block';
    msg.innerText = 'Validando acceso...';

    const resultado = await ApiService.validarAcceso(codigoSocio);

    if (resultado.ok) {
        msg.className = 'mt-3 p-3 text-sm rounded-lg font-medium text-center bg-green-100 text-green-700 block';
        msg.innerText = `Acceso Permitido: ${resultado.mensaje || '¡Bienvenido(a)!'}`;
    } else {
        msg.className = 'mt-3 p-3 text-sm rounded-lg font-medium text-center bg-red-100 text-red-700 block';
        msg.innerText = `Acceso Denegado: ${resultado.mensaje || 'Membresía vencida o código no encontrado'}`;
    }

    inputCodigo.value = '';
    inputCodigo.focus();

    try {
        await cargarAccesos();
        cargarGraficas();
    } catch (errTabla) {
        console.warn('La entrada se registró, pero falló al refrescar el historial:', errTabla);
    }
}

// Historial de Accesos
async function cargarAccesos() {
    const tbody = document.getElementById('tabla-accesos-body');
    if (!tbody) return;
    try {
        const accesos = await ApiService.getAccesos();
        tbody.innerHTML = '';
        if (!accesos || accesos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500">No hay registros de acceso hoy.</td></tr>';
            return;
        }

        accesos.forEach(a => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition';
            row.innerHTML = `
                <td class="p-3 font-mono text-gray-600">${a.fechaHora ? new Date(a.fechaHora).toLocaleString('es-MX') : 'N/A'}</td>
                <td class="p-3 font-mono font-bold text-indigo-600">${a.codigoUsuario || a.codigoSocio}</td>
                <td class="p-3 font-medium text-gray-800">${a.nombre || 'Socio'}</td>
                <td class="p-3 text-gray-500">${a.tipo || 'MEMBRESIA'}</td>
                <td class="p-3">
                    <span class="px-2.5 py-1 text-[10px] font-bold rounded-full uppercase ${(a.resultadoAcceso === 'PERMITIDO' || a.permitido) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${a.resultadoAcceso || (a.permitido ? 'Permitido' : 'Denegado')}
                    </span>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-red-500">No se pudo cargar el historial.</td></tr>';
    }
}

// ==========================================
// SECCIÓN DE CORTE DE CAJA DIARIO (ARQUEO)
// ==========================================
async function cargarCorteCaja() {
    try {
        const resumen = await ApiService.getResumenCajaHoy();
        resumenCajaHoyCache = resumen;

        const formato = (num) => `$${Number(num || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        if (resumen) {
            const setTxt = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.innerText = val;
            };

            setTxt('caja-subtotal-efectivo', formato(resumen.totalEfectivo));
            setTxt('caja-subtotal-tarjeta', formato(resumen.totalTarjeta));
            setTxt('caja-subtotal-transferencia', formato(resumen.totalTransferencia));
            setTxt('caja-total-general', formato(resumen.totalIngresos));
            setTxt('caja-conteo-transacciones', `${resumen.cantidadTransacciones} transacciones hoy`);
            setTxt('badge-total-pagos-hoy', `${resumen.cantidadTransacciones} Pagos`);

            // Rellenar tabla de pagos de hoy
            const tbody = document.getElementById('tabla-corte-pagos-body');
            if (tbody) {
                tbody.innerHTML = '';
                const pagos = resumen.pagosHoy || [];
                if (pagos.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-400">No se han registrado pagos el día de hoy.</td></tr>';
                } else {
                    pagos.forEach(p => {
                        const tr = document.createElement('tr');
                        tr.className = 'hover:bg-gray-50 border-b border-gray-100';
                        const badgeMetodo = p.metodoPago === 'EFECTIVO'
                            ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Efectivo</span>'
                            : (p.metodoPago === 'TARJETA'
                                ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800">Tarjeta</span>'
                                : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">Transferencia</span>');

                        tr.innerHTML = `
                            <td class="p-3 font-mono font-bold text-gray-500">#${p.id}</td>
                            <td class="p-3">
                                <span class="font-bold text-indigo-700 font-mono block">${p.codigoSocio}</span>
                                <span class="text-gray-600 text-[11px]">${p.nombreSocio}</span>
                            </td>
                            <td class="p-3 text-gray-700 font-medium">${p.nombrePlan}</td>
                            <td class="p-3">${badgeMetodo}</td>
                            <td class="p-3 text-right font-bold text-gray-900 font-mono">${formato(p.monto)}</td>
                        `;
                        tbody.appendChild(tr);
                    });
                }
            }
        }

        recalcularArqueoCaja();
        await cargarHistorialCortes();
    } catch (err) {
        console.error('Error al cargar corte de caja:', err);
    }
}

function recalcularArqueoCaja() {
    const fondoInicialInput = document.getElementById('corte-fondo-inicial');
    const efectivoRealInput = document.getElementById('corte-efectivo-real');
    const displayEsperado = document.getElementById('corte-esperado-display');
    const displayDiferencia = document.getElementById('corte-diferencia-display');
    const boxDiferencia = document.getElementById('corte-box-diferencia');
    const lblDiferencia = document.getElementById('lbl-diferencia');
    const estadoDiferencia = document.getElementById('corte-estado-diferencia');

    const formato = (num) => `$${Number(num || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const fondoInicial = parseFloat(fondoInicialInput ? fondoInicialInput.value : 0) || 0;
    const totalEfectivoCobrado = resumenCajaHoyCache ? Number(resumenCajaHoyCache.totalEfectivo || 0) : 0;
    const totalEsperado = fondoInicial + totalEfectivoCobrado;

    if (displayEsperado) {
        displayEsperado.innerText = formato(totalEsperado);
    }

    const valorRealRaw = efectivoRealInput ? efectivoRealInput.value.trim() : '';

    if (valorRealRaw === '') {
        if (displayDiferencia) displayDiferencia.innerText = '$0.00';
        if (boxDiferencia) {
            boxDiferencia.className = 'p-3.5 rounded-xl border flex justify-between items-center bg-gray-50 border-gray-200 transition';
        }
        if (lblDiferencia) lblDiferencia.className = 'text-[10px] font-bold uppercase tracking-wider block text-gray-500';
        if (estadoDiferencia) {
            estadoDiferencia.className = 'text-[11px] font-semibold text-gray-500';
            estadoDiferencia.innerText = 'Ingresa el efectivo contado';
        }
        return;
    }

    const efectivoReal = parseFloat(valorRealRaw) || 0;
    const diferencia = efectivoReal - totalEsperado;

    if (displayDiferencia) {
        const signo = diferencia > 0 ? '+ ' : (diferencia < 0 ? '- ' : '');
        displayDiferencia.innerText = `${signo}${formato(Math.abs(diferencia))}`;
    }

    if (Math.abs(diferencia) < 0.01) {
        if (boxDiferencia) boxDiferencia.className = 'p-3.5 rounded-xl border flex justify-between items-center bg-emerald-50 border-emerald-300 text-emerald-800 transition';
        if (lblDiferencia) lblDiferencia.className = 'text-[10px] font-bold uppercase tracking-wider block text-emerald-600';
        if (displayDiferencia) displayDiferencia.className = 'text-xl font-black font-mono text-emerald-700';
        if (estadoDiferencia) {
            estadoDiferencia.className = 'text-[11px] font-bold text-emerald-700';
            estadoDiferencia.innerText = '✓ ¡Caja cuadrada con exactitud!';
        }
    } else if (diferencia > 0) {
        if (boxDiferencia) boxDiferencia.className = 'p-3.5 rounded-xl border flex justify-between items-center bg-teal-50 border-teal-300 text-teal-800 transition';
        if (lblDiferencia) lblDiferencia.className = 'text-[10px] font-bold uppercase tracking-wider block text-teal-600';
        if (displayDiferencia) displayDiferencia.className = 'text-xl font-black font-mono text-teal-700';
        if (estadoDiferencia) {
            estadoDiferencia.className = 'text-[11px] font-bold text-teal-700';
            estadoDiferencia.innerText = '▲ Sobrante de efectivo en gaveta';
        }
    } else {
        if (boxDiferencia) boxDiferencia.className = 'p-3.5 rounded-xl border flex justify-between items-center bg-rose-50 border-rose-300 text-rose-800 transition';
        if (lblDiferencia) lblDiferencia.className = 'text-[10px] font-bold uppercase tracking-wider block text-rose-600';
        if (displayDiferencia) displayDiferencia.className = 'text-xl font-black font-mono text-rose-700';
        if (estadoDiferencia) {
            estadoDiferencia.className = 'text-[11px] font-bold text-rose-700';
            estadoDiferencia.innerText = '▼ Faltante de dinero en gaveta';
        }
    }
}

async function manejarGuardarCorte(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-guardar-corte');
    const msg = document.getElementById('corte-mensaje');

    const responsable = document.getElementById('corte-responsable').value.trim();
    const fondoInicial = parseFloat(document.getElementById('corte-fondo-inicial').value) || 0;
    const efectivoRealInput = document.getElementById('corte-efectivo-real').value.trim();

    if (efectivoRealInput === '') {
        if (msg) {
            msg.className = 'mt-3 p-2.5 rounded-lg text-xs font-medium text-center bg-red-100 text-red-700 block';
            msg.innerText = 'Por favor ingresa el dinero físico real contado en la gaveta.';
        }
        return;
    }

    const efectivoReal = parseFloat(efectivoRealInput) || 0;
    const observaciones = document.getElementById('corte-observaciones').value.trim();

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando Corte...';

    try {
        const corteGuardado = await ApiService.realizarCorteCaja({
            usuarioResponsable: responsable,
            fondoInicial,
            efectivoReal,
            observaciones
        });

        if (msg) {
            msg.className = 'mt-3 p-2.5 rounded-lg text-xs font-medium text-center bg-green-100 text-green-700 block';
            msg.innerText = '✓ Corte de caja guardado exitosamente en el historial.';
            setTimeout(() => msg.classList.add('hidden'), 4000);
        }

        await cargarHistorialCortes();

        // Preguntar si desea imprimir el acta de corte de caja
        if (confirm('El corte de caja se ha guardado correctamente. ¿Deseas imprimir el comprobante de arqueo?')) {
            imprimirCorteCaja();
        }
    } catch (err) {
        if (msg) {
            msg.className = 'mt-3 p-2.5 rounded-lg text-xs font-medium text-center bg-red-100 text-red-700 block';
            msg.innerText = `Error: ${err.message}`;
        }
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-lock"></i> Finalizar y Guardar Corte de Caja';
    }
}

function imprimirCorteCaja() {
    const responsable = document.getElementById('corte-responsable') ? document.getElementById('corte-responsable').value : 'Recepcionista Turno';
    const fondoInicial = parseFloat(document.getElementById('corte-fondo-inicial') ? document.getElementById('corte-fondo-inicial').value : 0) || 0;
    const efectivoReal = parseFloat(document.getElementById('corte-efectivo-real') ? document.getElementById('corte-efectivo-real').value : 0) || 0;
    const observaciones = document.getElementById('corte-observaciones') ? document.getElementById('corte-observaciones').value : '';

    const totalEfectivo = resumenCajaHoyCache ? Number(resumenCajaHoyCache.totalEfectivo || 0) : 0;
    const totalTarjeta = resumenCajaHoyCache ? Number(resumenCajaHoyCache.totalTarjeta || 0) : 0;
    const totalTransferencia = resumenCajaHoyCache ? Number(resumenCajaHoyCache.totalTransferencia || 0) : 0;
    const totalIngresos = resumenCajaHoyCache ? Number(resumenCajaHoyCache.totalIngresos || 0) : 0;
    const transacciones = resumenCajaHoyCache ? resumenCajaHoyCache.cantidadTransacciones : 0;
    const pagosHoy = resumenCajaHoyCache ? resumenCajaHoyCache.pagosHoy : [];

    const totalEsperadoEfectivo = fondoInicial + totalEfectivo;
    const diferencia = efectivoReal - totalEsperadoEfectivo;

    TicketPrinter.imprimirCorte({
        fechaHora: new Date().toLocaleString('es-MX'),
        usuarioResponsable: responsable,
        fondoInicial,
        totalEfectivo,
        totalTarjeta,
        totalTransferencia,
        totalIngresos,
        totalEsperadoEfectivo,
        efectivoReal,
        diferencia,
        observaciones,
        cantidadTransacciones: transacciones,
        pagosHoy
    });
}

async function cargarHistorialCortes() {
    const tbody = document.getElementById('tabla-historial-cortes-body');
    if (!tbody) return;

    try {
        const historial = await ApiService.getHistorialCortes();
        tbody.innerHTML = '';

        if (!historial || historial.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="p-4 text-center text-gray-400">No hay cortes de caja registrados en el historial.</td></tr>';
            return;
        }

        const formato = (num) => `$${Number(num || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        historial.forEach(c => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50 border-b border-gray-100 text-xs';

            const difNum = Number(c.diferencia || 0);
            let difBadge = '';
            if (Math.abs(difNum) < 0.01) {
                difBadge = '<span class="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 text-[10px]">Exacta ($0.00)</span>';
            } else if (difNum > 0) {
                difBadge = `<span class="px-2 py-0.5 rounded-full font-bold bg-teal-100 text-teal-800 text-[10px]">+${formato(difNum)}</span>`;
            } else {
                difBadge = `<span class="px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 text-[10px]">-${formato(Math.abs(difNum))}</span>`;
            }

            tr.innerHTML = `
                <td class="p-3 font-mono text-gray-600">${c.fechaHora ? new Date(c.fechaHora).toLocaleString('es-MX') : 'N/A'}</td>
                <td class="p-3 font-semibold text-gray-800">${c.usuarioResponsable || 'N/A'}</td>
                <td class="p-3 text-right font-mono text-gray-500">${formato(c.fondoInicial)}</td>
                <td class="p-3 text-right font-mono font-bold text-indigo-700">${formato(c.totalIngresos)}</td>
                <td class="p-3 text-right font-mono text-emerald-700">${formato(c.totalEfectivo)}</td>
                <td class="p-3 text-right font-mono text-sky-700">${formato(c.totalEsperadoEfectivo)}</td>
                <td class="p-3 text-right font-mono font-bold text-gray-800">${formato(c.efectivoReal)}</td>
                <td class="p-3 text-center">${difBadge}</td>
                <td class="p-3 text-gray-500 max-w-xs truncate" title="${c.observaciones || ''}">${c.observaciones || '<span class="text-gray-300 italic">Sin notas</span>'}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="9" class="p-4 text-center text-red-500">Error al consultar el historial de cortes.</td></tr>';
    }
}

// ==========================================
// SECCIÓN DE ANALÍTICAS - CHART.JS
// ==========================================
async function cargarGraficas() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js no está disponible aún.');
        return;
    }

    Chart.defaults.font.family = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
    Chart.defaults.color = '#6b7280';

    await Promise.allSettled([
        renderGraficaIngresos(),
        renderGraficaHorariosPico(),
        renderGraficaEstadoMembresias(),
        renderGraficaMetodosPago(),
        renderGraficaDistribucionPlanes()
    ]);
}

// 1. Gráfica de Ingresos Mensuales
async function renderGraficaIngresos() {
    const canvas = document.getElementById('chart-ingresos-mensuales');
    if (!canvas) return;

    const data = await ApiService.getIngresosMensuales();
    const labels = data.map(d => d.mes);
    const montos = data.map(d => Number(d.total) || 0);

    const totalIngresos = montos.reduce((acc, curr) => acc + curr, 0);
    const badgeTotal = document.getElementById('badge-total-ingresos');
    if (badgeTotal) {
        badgeTotal.innerText = `$${totalIngresos.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    if (chartIngresosInstance) {
        chartIngresosInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, 'rgba(79, 70, 229, 0.25)');
    gradient.addColorStop(1, 'rgba(79, 70, 229, 0.01)');

    chartIngresosInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.length ? labels : ['Sin datos'],
            datasets: [{
                label: 'Ingresos Mensuales',
                data: montos.length ? montos : [0],
                borderColor: '#4f46e5',
                borderWidth: 2.5,
                backgroundColor: gradient,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#4f46e5',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label: (ctx) => ` Ingresos: $${Number(ctx.raw).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(243, 244, 246, 1)' },
                    ticks: {
                        callback: (value) => `$${Number(value).toLocaleString('es-MX')}`
                    }
                }
            }
        }
    });
}

// 2. Gráfica de Horarios Pico de Acceso
async function renderGraficaHorariosPico() {
    const canvas = document.getElementById('chart-horarios-pico');
    if (!canvas) return;

    const data = await ApiService.getHorariosPico();
    const lista = Array.isArray(data) ? data : [];
    const labels = lista.map(d => d.hora || d.label || '');
    const conteos = lista.map(d => Number(d.accesos !== undefined ? d.accesos : (d.cantidad !== undefined ? d.cantidad : 0)) || 0);

    let maxAccesos = 0;
    let horaPico = '--:--';
    lista.forEach(d => {
        const acc = Number(d.accesos !== undefined ? d.accesos : (d.cantidad !== undefined ? d.cantidad : 0)) || 0;
        if (acc > maxAccesos) {
            maxAccesos = acc;
            horaPico = d.hora || d.label || '--:--';
        }
    });

    const badgeHoraPico = document.getElementById('badge-hora-pico');
    if (badgeHoraPico) {
        badgeHoraPico.innerText = maxAccesos > 0 ? `${horaPico} (${maxAccesos})` : 'Sin registros';
    }

    if (chartHorariosInstance) {
        chartHorariosInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    chartHorariosInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length ? labels : ['06:00', '12:00', '18:00'],
            datasets: [{
                label: 'Entradas registradas',
                data: conteos.length ? conteos : [0, 0, 0],
                backgroundColor: 'rgba(245, 158, 11, 0.85)',
                hoverBackgroundColor: '#d97706',
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label: (ctx) => ` ${ctx.raw || 0} ${(ctx.raw === 1) ? 'entrada' : 'entradas'}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 0,
                        font: { size: 10 }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(243, 244, 246, 1)' },
                    ticks: {
                        stepSize: 1,
                        precision: 0
                    }
                }
            }
        }
    });
}

// 3. Gráfica de Estado de Membresías
async function renderGraficaEstadoMembresias() {
    const canvas = document.getElementById('chart-estado-membresias');
    if (!canvas) return;

    const data = await ApiService.getEstadoMembresias();
    const activas = data ? Number(data.activas) || 0 : 0;
    const porVencer = data ? Number(data.porVencer) || 0 : 0;
    const vencidas = data ? Number(data.vencidas) || 0 : 0;

    const totalSocios = activas + porVencer + vencidas;
    const badgeSocios = document.getElementById('badge-total-socios');
    if (badgeSocios) {
        badgeSocios.innerText = `${totalSocios} Socios`;
    }

    if (chartMembresiasInstance) {
        chartMembresiasInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    chartMembresiasInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Activas', 'Por Vencer (≤5 d)', 'Vencidas'],
            datasets: [{
                data: totalSocios > 0 ? [activas, porVencer, vencidas] : [1, 0, 0],
                backgroundColor: totalSocios > 0 ? ['#10b981', '#f59e0b', '#ef4444'] : ['#e5e7eb', '#e5e7eb', '#e5e7eb'],
                hoverBackgroundColor: totalSocios > 0 ? ['#059669', '#d97706', '#dc2626'] : ['#d1d5db', '#d1d5db', '#d1d5db'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 14,
                        font: { size: 11, weight: '500' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label: (ctx) => {
                            if (totalSocios === 0) return ' Sin socios registrados';
                            const val = ctx.raw || 0;
                            const pct = totalSocios > 0 ? ((val / totalSocios) * 100).toFixed(1) : 0;
                            return ` ${ctx.label}: ${val} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

// 4. Gráfica de Métodos de Pago
async function renderGraficaMetodosPago() {
    const canvas = document.getElementById('chart-metodos-pago');
    if (!canvas) return;

    const data = await ApiService.getMetodosPago();
    const lista = Array.isArray(data) ? data : [];
    const labels = lista.map(d => d.metodo || d.nombre || '');
    const cantidades = lista.map(d => Number(d.cantidad !== undefined ? d.cantidad : (d.transacciones !== undefined ? d.transacciones : 0)) || 0);

    const totalPagos = cantidades.reduce((acc, curr) => acc + curr, 0);
    const badgePagos = document.getElementById('badge-total-pagos');
    if (badgePagos) {
        badgePagos.innerText = `${totalPagos} Pagos`;
    }

    if (chartMetodosInstance) {
        chartMetodosInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    chartMetodosInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: totalPagos > 0 ? labels : ['Sin transacciones registradas'],
            datasets: [{
                data: totalPagos > 0 ? cantidades : [1],
                backgroundColor: totalPagos > 0 ? ['#6366f1', '#06b6d4', '#8b5cf6'] : ['#e5e7eb'],
                hoverBackgroundColor: totalPagos > 0 ? ['#4f46e5', '#0891b2', '#7c3aed'] : ['#d1d5db'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 14,
                        font: { size: 11, weight: '500' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label: (ctx) => {
                            if (totalPagos === 0) return ' Sin transacciones registradas';
                            const idx = ctx.dataIndex;
                            const item = lista[idx];
                            const monto = item && (item.total !== undefined || item.monto !== undefined)
                                ? `$${Number(item.total || item.monto || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                                : '$0.00';
                            return ` ${ctx.label}: ${ctx.raw || 0} transacciones (${monto})`;
                        }
                    }
                }
            }
        }
    });
}

// 5. Gráfica de Distribución y Conversión de Planes (Filtro Clientes Únicos)
async function renderGraficaDistribucionPlanes() {
    const canvas = document.getElementById('chart-distribucion-planes');
    const tbody = document.getElementById('tabla-distribucion-planes-body');
    const badgeSociosPlanes = document.getElementById('badge-total-socios-planes');

    if (!canvas) return;

    const data = await ApiService.getDistribucionPlanes();
    const lista = Array.isArray(data) ? data : [];
    const formatoMoneda = (val) => `$${Number(val || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    let totalClientesUnicos = 0;
    if (lista.length > 0) {
        totalClientesUnicos = lista.reduce((acc, d) => acc + (Number(d.clientesUnicos || d.clientes || 0) || 0), 0);
    }

    if (badgeSociosPlanes) {
        badgeSociosPlanes.innerText = `${totalClientesUnicos} Clientes Únicos`;
    }

    // Actualizar tabla informativa al lado de la gráfica
    if (tbody) {
        tbody.innerHTML = '';
        if (lista.length === 0 || totalClientesUnicos === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-400">No hay pagos registrados para analizar la preferencia de planes.</td></tr>';
        } else {
            lista.forEach(d => {
                const nombrePlan = d.nombrePlan || d.plan || d.nombre || 'General';
                const clientesUnicos = Number(d.clientesUnicos || d.clientes || 0);
                const porcentaje = Number(d.porcentajeClientes !== undefined ? d.porcentajeClientes : (d.porcentaje || 0)).toFixed(1);
                const totalVentas = Number(d.totalVentas || d.ventas || 0);
                const totalIngresos = Number(d.totalIngresos || d.ingresos || 0);

                const tr = document.createElement('tr');
                tr.className = 'hover:bg-gray-50 border-b border-gray-100';

                tr.innerHTML = `
                    <td class="p-2.5 font-semibold text-gray-800 flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                        ${nombrePlan}
                    </td>
                    <td class="p-2.5 text-center font-bold text-gray-800 font-mono">${clientesUnicos}</td>
                    <td class="p-2.5 text-center">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                            ${porcentaje}%
                        </span>
                    </td>
                    <td class="p-2.5 text-center text-gray-600 font-mono">${totalVentas}</td>
                    <td class="p-2.5 text-right font-bold text-indigo-700 font-mono">${formatoMoneda(totalIngresos)}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    }

    if (chartDistribucionInstance) {
        chartDistribucionInstance.destroy();
    }

    const labels = (lista.length > 0 && totalClientesUnicos > 0) ? lista.map(d => d.nombrePlan || d.plan || d.nombre || 'Plan') : ['Sin datos registrados'];
    const conteosUnicos = (lista.length > 0 && totalClientesUnicos > 0) ? lista.map(d => Number(d.clientesUnicos || d.clientes || 0) || 0) : [1];

    const paletaColores = [
        '#0d9488', // Teal
        '#4f46e5', // Indigo
        '#f59e0b', // Amber
        '#06b6d4', // Cyan
        '#8b5cf6', // Violet
        '#ec4899', // Pink
        '#10b981', // Emerald
        '#f97316'  // Orange
    ];

    const ctx = canvas.getContext('2d');
    chartDistribucionInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: conteosUnicos,
                backgroundColor: (lista.length > 0 && totalClientesUnicos > 0) ? paletaColores.slice(0, labels.length) : ['#e5e7eb'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 12,
                        font: { size: 10, weight: '500' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label: (ctx) => {
                            if (lista.length === 0 || totalClientesUnicos === 0) return ' Sin información registrada';
                            const idx = ctx.dataIndex;
                            const item = lista[idx];
                            const pct = item ? (item.porcentajeClientes !== undefined ? item.porcentajeClientes : item.porcentaje) : 0;
                            const ventas = item ? (item.totalVentas || item.ventas || 0) : 0;
                            const ingresos = item ? formatoMoneda(item.totalIngresos || item.ingresos) : '$0.00';
                            return ` ${ctx.label}: ${ctx.raw || 0} cliente(s) único(s) (${pct}%) — ${ventas} boletos/ventas (${ingresos})`;
                        }
                    }
                }
            }
        }
    });
}
