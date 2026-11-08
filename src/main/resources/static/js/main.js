// Instancias de Chart.js para evitar conflictos de canvas duplicados
let chartIngresosInstance = null;
let chartHorariosInstance = null;
let chartMembresiasInstance = null;
let chartMetodosInstance = null;

// Catálogo de Planes en memoria
let planesDisponibles = [];

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

    // Detectar hash en URL si existe (ej. index.html#registro)
    const hash = window.location.hash.replace('#', '');
    if (['dashboard', 'pagos', 'registro', 'accesos'].includes(hash)) {
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

    // Botones de Refresco
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
    const vistaRegistro = document.getElementById('vista-registro');
    const vistaAccesos = document.getElementById('vista-accesos');

    const btnDashboard = document.getElementById('btn-nav-dashboard');
    const btnPagos = document.getElementById('btn-nav-pagos');
    const btnRegistro = document.getElementById('btn-nav-registro');
    const btnAccesos = document.getElementById('btn-nav-accesos');
    const tituloSeccion = document.getElementById('titulo-seccion');

    const estiloActivo = 'w-full text-left px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-3 bg-indigo-800 text-white shadow-sm transition';
    const estiloInactivo = 'w-full text-left px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-3 hover:bg-indigo-800/60 text-indigo-200 hover:text-white transition';

    // Ocultar todas las secciones
    if (vistaDashboard) vistaDashboard.classList.add('hidden');
    if (vistaPagos) vistaPagos.classList.add('hidden');
    if (vistaRegistro) vistaRegistro.classList.add('hidden');
    if (vistaAccesos) vistaAccesos.classList.add('hidden');

    // Desactivar botones de navegación
    if (btnDashboard) btnDashboard.className = estiloInactivo;
    if (btnPagos) btnPagos.className = estiloInactivo;
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

    actualizarPrecioDisplay(selectId, cantidadId, priceDisplayId, durationDisplayId);
}

function actualizarPrecioDisplay(selectId, cantidadId, priceDisplayId, durationDisplayId) {
    const select = document.getElementById(selectId);
    const inputCant = document.getElementById(cantidadId);
    const priceDisplay = document.getElementById(priceDisplayId);
    const durationDisplay = document.getElementById(durationDisplayId);

    if (!select || !priceDisplay) return;

    const planId = parseInt(select.value);
    const plan = planesDisponibles.find(p => p.id === planId);
    let cant = inputCant ? parseInt(inputCant.value) : 1;
    if (isNaN(cant) || cant < 1) {
        cant = 1;
    }

    if (plan) {
        const precioUnitario = Number(plan.precio) || 0;
        const precioTotal = precioUnitario * cant;
        priceDisplay.innerText = `$${precioTotal.toFixed(2)}`;

        if (durationDisplay) {
            const planCantidad = plan.cantidad || 1;
            const duracionTotal = planCantidad * cant;
            const unidadTxt = formatearUnidad(duracionTotal, plan.tipoUnidad);
            if (cant > 1) {
                durationDisplay.innerText = `Total: ${duracionTotal} ${unidadTxt} (${cant} × $${precioUnitario.toFixed(2)})`;
            } else {
                durationDisplay.innerText = `Duración del plan: ${duracionTotal} ${unidadTxt}`;
            }
        }
    } else {
        priceDisplay.innerText = '$0.00';
        if (durationDisplay) {
            durationDisplay.innerText = 'Selecciona un plan para ver duración';
        }
    }
}

// Modal CRUD de Planes
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
        const todos = await ApiService.getPlanes(false);
        tbody.innerHTML = '';
        if (!todos || todos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="p-3 text-center text-gray-500">No hay planes registrados.</td></tr>';
            return;
        }

        todos.forEach(p => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition';
            const duracion = `${p.cantidad} ${formatearUnidad(p.cantidad, p.tipoUnidad)}`;
            row.innerHTML = `
                <td class="p-2.5 font-semibold text-gray-800">${p.nombre}</td>
                <td class="p-2.5 text-gray-600">${duracion}</td>
                <td class="p-2.5 font-mono font-bold text-indigo-600">$${Number(p.precio).toFixed(2)}</td>
                <td class="p-2.5">
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded-full ${p.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td class="p-2.5 text-right">
                    ${p.activo ? `
                        <button onclick="desactivarPlan(${p.id})" class="text-red-600 hover:text-red-800 font-semibold text-[11px] px-2 py-1 bg-red-50 hover:bg-red-100 rounded transition">
                            Desactivar
                        </button>
                    ` : `
                        <button onclick="activarPlan(${p.id})" class="text-green-600 hover:text-green-800 font-semibold text-[11px] px-2 py-1 bg-green-50 hover:bg-green-100 rounded transition">
                            Reactivar
                        </button>
                    `}
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-3 text-center text-red-500">Error al cargar planes.</td></tr>';
    }
}

async function manejarCrearPlan(e) {
    e.preventDefault();
    const msg = document.getElementById('modal-plan-mensaje');
    msg.classList.add('hidden');

    const nuevoPlan = {
        nombre: document.getElementById('nuevo-plan-nombre').value.trim(),
        precio: parseFloat(document.getElementById('nuevo-plan-precio').value),
        cantidad: parseInt(document.getElementById('nuevo-plan-cantidad').value),
        tipoUnidad: document.getElementById('nuevo-plan-unidad').value,
        activo: true
    };

    try {
        await ApiService.crearPlan(nuevoPlan);
        msg.className = 'text-xs p-2 rounded text-center font-medium bg-green-100 text-green-800 border border-green-200';
        msg.innerText = '¡Plan guardado exitosamente!';
        msg.classList.remove('hidden');

        document.getElementById('form-crear-plan').reset();
        await cargarPlanes();
        cargarTablaModalPlanes();
    } catch (err) {
        msg.className = 'text-xs p-2 rounded text-center font-medium bg-red-100 text-red-800 border border-red-200';
        msg.innerText = err.message || 'Error al guardar el plan';
        msg.classList.remove('hidden');
    }
}

async function desactivarPlan(id) {
    if (!confirm('¿Deseas dar de baja este plan? Los socios vigentes conservarán su periodo activo.')) return;
    try {
        await ApiService.desactivarPlan(id);
        await cargarPlanes();
        cargarTablaModalPlanes();
    } catch (err) {
        alert('Error al desactivar el plan: ' + err.message);
    }
}

async function activarPlan(id) {
    try {
        await ApiService.actualizarPlan(id, { activo: true });
        await cargarPlanes();
        cargarTablaModalPlanes();
    } catch (err) {
        alert('Error al reactivar el plan: ' + err.message);
    }
}

// Resumen del Dashboard (Métricas Superiores)
async function cargarDashboard() {
    try {
        const data = await ApiService.getResumenDashboard();
        if (!data) return;
        document.getElementById('metric-activos').innerText = data.totalSociosActivos;
        document.getElementById('metric-vencidos').innerText = data.totalSociosVencidos;
        document.getElementById('metric-por-vencer').innerText = data.sociosPorVencer || 0;
        document.getElementById('metric-ingresos').innerText = `$${Number(data.ingresosMesActual || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } catch (e) {
        console.error('Error al cargar métricas de dashboard:', e);
    }
}

// Búsqueda y Lista de Socios
async function cargarSocios(query = '') {
    const tbody = document.getElementById('tabla-busqueda-body');
    if (!tbody) return;
    try {
        const usuarios = await ApiService.buscarSocios(query);
        tbody.innerHTML = '';
        if (!usuarios || usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gray-500">No se encontraron socios.</td></tr>';
            return;
        }

        usuarios.forEach(u => {
            const hoy = new Date().toISOString().split('T')[0];
            const activo = u.fechaMembresiaFin && u.fechaMembresiaFin >= hoy;
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition';
            row.innerHTML = `
                <td class="p-3 font-mono font-bold text-indigo-600">${u.codigoSocio || 'N/A'}</td>
                <td class="p-3 font-medium text-gray-800">${u.nombre} ${u.apellido || ''}</td>
                <td class="p-3 text-gray-500">${u.telefono || 'N/A'}</td>
                <td class="p-3">${u.fechaMembresiaFin || 'Sin vigencia'}</td>
                <td class="p-3">
                    <span class="px-2.5 py-1 text-[10px] font-bold rounded-full uppercase ${u.esEmpleado ? 'bg-blue-100 text-blue-800 border border-blue-200' : (activo ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200')}">
                        ${u.esEmpleado ? 'Staff / Empleado' : (activo ? 'Activo' : 'Vencido')}
                    </span>
                </td>
                <td class="p-3">
                    <button onclick="seleccionarParaPago('${u.codigoSocio}')" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1 rounded-md font-semibold text-xs transition">Cobrar</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-red-500">Error al consultar socios.</td></tr>';
    }
}

function seleccionarParaPago(codigoSocio) {
    if (!codigoSocio || codigoSocio === 'N/A') return;
    cambiarSeccion('pagos');
    const inputCodigo = document.getElementById('pago-codigo');
    const selectPlanes = document.getElementById('select-planes');
    const inputCantidad = document.getElementById('pago-cantidad');
    if (inputCodigo) inputCodigo.value = codigoSocio;
    if (inputCantidad) inputCantidad.value = 1;
    if (selectPlanes) {
        selectPlanes.focus();
        selectPlanes.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Procesar Pago (Vinculado a PlanMembresiaId y Multiplicador de Cantidad)
async function manejarFormularioPago(e) {
    e.preventDefault();
    const mensajeDiv = document.getElementById('pago-mensaje');
    mensajeDiv.classList.add('hidden');

    const selectPlanes = document.getElementById('select-planes');
    const inputCantidad = document.getElementById('pago-cantidad');
    const planMembresiaId = selectPlanes ? parseInt(selectPlanes.value) : null;
    let cantidad = inputCantidad ? parseInt(inputCantidad.value) : 1;
    if (isNaN(cantidad) || cantidad < 1) cantidad = 1;

    if (!planMembresiaId) {
        mensajeDiv.className = 'mt-3 p-3 text-xs rounded-lg text-center font-medium bg-red-100 text-red-800 border border-red-200';
        mensajeDiv.innerText = 'Por favor, selecciona un plan de membresía de la lista.';
        mensajeDiv.classList.remove('hidden');
        return;
    }

    const payload = {
        codigoSocio: document.getElementById('pago-codigo').value.trim().toUpperCase(),
        planMembresiaId: planMembresiaId,
        cantidad: cantidad,
        metodoPago: document.getElementById('pago-metodo').value
    };

    try {
        const resultadoBackend = await ApiService.registrarPago(payload);

        mensajeDiv.className = 'mt-3 p-3 text-xs rounded-lg text-center font-medium bg-green-100 text-green-800 border border-green-200';
        const vencimientoStr = resultadoBackend.fechaMembresiaFin ? ` (Nueva vigencia: ${resultadoBackend.fechaMembresiaFin})` : '';
        mensajeDiv.innerText = `¡Pago registrado con éxito! Plan: ${resultadoBackend.nombrePlan || ''} - $${Number(resultadoBackend.monto).toFixed(2)}${vencimientoStr}`;
        mensajeDiv.classList.remove('hidden');

        // Imprimir ticket con los datos exactos del backend
        if (window.TicketPrinter) {
            TicketPrinter.imprimir(resultadoBackend);
        }

        document.getElementById('form-pago').reset();
        if (inputCantidad) inputCantidad.value = 1;
        actualizarPrecioDisplay('select-planes', 'pago-cantidad', 'pago-precio-display', 'info-duracion-plan');
        cargarDashboard();
        cargarSocios();
        cargarGraficas();
    } catch (err) {
        mensajeDiv.className = 'mt-3 p-3 text-xs rounded-lg text-center font-medium bg-red-100 text-red-800 border border-red-200';
        mensajeDiv.innerText = err.message || 'Error al registrar el pago. Verifique el código de socio.';
        mensajeDiv.classList.remove('hidden');
    }
}

// Gestión de Registro de Nuevos Socios
function alternarSeccionPago() {
    const chk = document.getElementById('esEmpleado');
    const seccionPago = document.getElementById('seccionPago');
    if (chk && seccionPago) {
        seccionPago.classList.toggle('hidden', chk.checked);
    }
}

async function manejarRegistro(event) {
    event.preventDefault();

    const respuestaDiv = document.getElementById('respuesta');
    const btnSubmit = document.getElementById('btnSubmit');

    respuestaDiv.classList.add('hidden');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> Procesando...`;

    const codigoSocio = document.getElementById('codigoSocio').value.trim().toUpperCase();
    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    const esEmpleado = document.getElementById('esEmpleado').checked;

    const usuarioData = {
        codigoSocio,
        nombre,
        apellido,
        telefono: document.getElementById('telefono').value.trim(),
        correo: document.getElementById('correo').value.trim(),
        esEmpleado
    };

    try {
        // 1. Guardar socio en backend
        await ApiService.crearUsuario(usuarioData);

        // 2. Si no es staff, cobrar con el plan oficial seleccionado y su multiplicador
        if (!esEmpleado) {
            const selectPlanesReg = document.getElementById('select-planes-registro');
            const inputCantidadReg = document.getElementById('registro-cantidad');
            const planMembresiaId = selectPlanesReg ? parseInt(selectPlanesReg.value) : null;
            let cantidad = inputCantidadReg ? parseInt(inputCantidadReg.value) : 1;
            if (isNaN(cantidad) || cantidad < 1) cantidad = 1;

            if (!planMembresiaId) {
                throw new Error('Por favor, selecciona un plan de membresía para el cobro inicial.');
            }

            const pagoData = {
                codigoSocio,
                planMembresiaId,
                cantidad,
                metodoPago: document.getElementById('metodoPago').value
            };

            const resultadoPago = await ApiService.registrarPago(pagoData);

            if (window.TicketPrinter) {
                TicketPrinter.imprimir(resultadoPago);
            }
        }

        // Feedback positivo
        respuestaDiv.classList.remove('hidden');
        respuestaDiv.className = 'mt-3 p-3 rounded-lg text-xs font-medium text-center bg-green-100 text-green-800 border border-green-200';
        respuestaDiv.innerHTML = `<i class="fa-solid fa-circle-check text-green-600 me-2"></i> ${
            esEmpleado ? 'Empleado registrado con éxito.' : '¡Socio registrado, cobrado y ticket emitido!'
        }`;

        document.getElementById('formRegistro').reset();
        const inputCantidadReg = document.getElementById('registro-cantidad');
        if (inputCantidadReg) inputCantidadReg.value = 1;
        actualizarPrecioDisplay('select-planes-registro', 'registro-cantidad', 'registro-precio-display', 'info-duracion-registro');
        alternarSeccionPago();
        document.getElementById('codigoSocio').focus();

        // Actualizar dashboard y tabla de socios
        cargarDashboard();
        cargarSocios();
        cargarGraficas();

    } catch (error) {
        respuestaDiv.classList.remove('hidden');
        respuestaDiv.className = 'mt-3 p-3 rounded-lg text-xs font-medium text-center bg-red-100 text-red-800 border border-red-200';
        respuestaDiv.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-red-600 me-2"></i> ${error.message}`;
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Registrar y Cobrar`;
    }
}

// Validar y Registrar Check-in
async function manejarCheckin(e) {
    if (e) e.preventDefault();

    const mensajeDiv = document.getElementById('checkin-mensaje');
    const inputCodigo = document.getElementById('input-checkin-codigo');
    const codigo = inputCodigo.value.trim().toUpperCase();

    if (!codigo) return;
    mensajeDiv.classList.add('hidden');

    let resultado;
    try {
        resultado = await ApiService.validarAcceso(codigo);
    } catch (errRed) {
        console.error('Error de red en validarAcceso:', errRed);
        mensajeDiv.classList.remove('hidden');
        mensajeDiv.className = 'mt-3 p-3 text-sm rounded-lg font-medium text-center bg-red-100 text-red-800 border border-red-200';
        mensajeDiv.innerHTML = `<i class="fa-solid fa-triangle-exclamation me-2"></i> Error de conexión con el servidor.`;
        return;
    }

    const { ok, mensaje } = resultado;
    mensajeDiv.classList.remove('hidden');

    const textoLower = (mensaje || '').toLowerCase();
    const esValido = ok && !textoLower.includes('vencid') && !textoLower.includes('denegad') && !textoLower.includes('no encontrad') && !textoLower.includes('error');

    if (esValido) {
        mensajeDiv.className = 'mt-3 p-3 text-sm rounded-lg font-medium text-center bg-green-100 text-green-800 border border-green-200';
        mensajeDiv.innerHTML = `<i class="fa-solid fa-circle-check me-2"></i> ${mensaje || '¡Acceso Permitido!'}`;
    } else {
        mensajeDiv.className = 'mt-3 p-3 text-sm rounded-lg font-medium text-center bg-red-100 text-red-800 border border-red-200';
        mensajeDiv.innerHTML = `<i class="fa-solid fa-circle-xmark me-2"></i> ${mensaje || 'Acceso Denegado'}`;
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
        renderGraficaMetodosPago()
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
    const labels = data.map(d => d.hora);
    const conteos = data.map(d => Number(d.accesos) || 0);

    let maxAccesos = -1;
    let horaPico = '--:--';
    data.forEach(d => {
        if (d.accesos > maxAccesos) {
            maxAccesos = d.accesos;
            horaPico = d.hora;
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
                        label: (ctx) => ` ${ctx.raw} ${ctx.raw === 1 ? 'entrada' : 'entradas'}`
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
    chartMembresInstance = new Chart(ctx, {
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
    const labels = data.map(d => d.metodo);
    const cantidades = data.map(d => Number(d.cantidad) || 0);

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
            labels: labels.length ? labels : ['Efectivo', 'Tarjeta', 'Transferencia'],
            datasets: [{
                data: totalPagos > 0 ? cantidades : [1, 0, 0],
                backgroundColor: totalPagos > 0 ? ['#6366f1', '#06b6d4', '#8b5cf6'] : ['#e5e7eb', '#e5e7eb', '#e5e7eb'],
                hoverBackgroundColor: totalPagos > 0 ? ['#4f46e5', '#0891b2', '#7c3aed'] : ['#d1d5db', '#d1d5db', '#d1d5db'],
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
                            const item = data[idx];
                            const monto = item && item.total ? `$${Number(item.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '$0.00';
                            return ` ${ctx.label}: ${ctx.raw} transacciones (${monto})`;
                        }
                    }
                }
            }
        }
    });
}
