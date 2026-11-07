// Instancias de Chart.js para evitar conflictos de canvas duplicados
let chartIngresosInstance = null;
let chartHorariosInstance = null;
let chartMembresiasInstance = null;
let chartMetodosInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    // Fecha en la cabecera
    const fechaElem = document.getElementById('fecha-actual');
    if (fechaElem) {
        fechaElem.innerText = new Date().toLocaleDateString('es-MX', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    // Cargas iniciales
    cargarDashboard();
    cargarSocios();
    cargarGraficas();

    // Eventos de Navegación Sidebar
    document.querySelectorAll('aside nav button[data-section]').forEach(btn => {
        btn.addEventListener('click', (e) => cambiarSeccion(e.currentTarget.dataset.section));
    });

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
});

// Control de Secciones de la Interfaz
function cambiarSeccion(seccion) {
    const vistaDashboard = document.getElementById('vista-dashboard');
    const vistaAccesos = document.getElementById('vista-accesos');
    const btnDashboard = document.getElementById('btn-nav-dashboard');
    const btnAnaliticas = document.getElementById('btn-nav-analiticas');
    const btnAccesos = document.getElementById('btn-nav-accesos');
    const tituloSeccion = document.getElementById('titulo-seccion');

    const estiloActivo = 'w-full text-left px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-3 bg-indigo-800 text-white shadow-sm transition';
    const estiloInactivo = 'w-full text-left px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-3 hover:bg-indigo-800/60 text-indigo-200 hover:text-white transition';

    if (seccion === 'dashboard') {
        vistaDashboard.classList.remove('hidden');
        vistaAccesos.classList.add('hidden');
        if (btnDashboard) btnDashboard.className = estiloActivo;
        if (btnAnaliticas) btnAnaliticas.className = estiloInactivo;
        if (btnAccesos) btnAccesos.className = estiloInactivo;
        if (tituloSeccion) tituloSeccion.innerText = 'Panel General';
        cargarDashboard();
        cargarGraficas();
    } else if (seccion === 'analiticas') {
        vistaDashboard.classList.remove('hidden');
        vistaAccesos.classList.add('hidden');
        if (btnDashboard) btnDashboard.className = estiloInactivo;
        if (btnAnaliticas) btnAnaliticas.className = estiloActivo;
        if (btnAccesos) btnAccesos.className = estiloInactivo;
        if (tituloSeccion) tituloSeccion.innerText = 'Analíticas y Rendimiento';
        cargarGraficas();
        const secAnaliticas = document.getElementById('seccion-analiticas');
        if (secAnaliticas) {
            secAnaliticas.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } else if (seccion === 'accesos') {
        vistaDashboard.classList.add('hidden');
        vistaAccesos.classList.remove('hidden');
        if (btnAccesos) btnAccesos.className = estiloActivo;
        if (btnDashboard) btnDashboard.className = estiloInactivo;
        if (btnAnaliticas) btnAnaliticas.className = estiloInactivo;
        if (tituloSeccion) tituloSeccion.innerText = 'Monitoreo de Accesos / Entrada';
        cargarAccesos();
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
    cambiarSeccion('dashboard');
    document.getElementById('pago-codigo').value = codigoSocio;
    document.getElementById('pago-monto').focus();
}

// Procesar Pago
async function manejarFormularioPago(e) {
    e.preventDefault();
    const mensajeDiv = document.getElementById('pago-mensaje');
    mensajeDiv.classList.add('hidden');

    const payload = {
        codigoSocio: document.getElementById('pago-codigo').value.trim().toUpperCase(),
        monto: parseFloat(document.getElementById('pago-monto').value),
        metodoPago: document.getElementById('pago-metodo').value,
        meses: parseInt(document.getElementById('pago-meses').value)
    };

    try {
        const resultadoBackend = await ApiService.registrarPago(payload);

        mensajeDiv.className = 'mt-3 p-3 text-xs rounded-lg text-center font-medium bg-green-100 text-green-800 border border-green-200';
        mensajeDiv.innerText = '¡Pago registrado y membresía renovada!';
        mensajeDiv.classList.remove('hidden');

        // Imprimir ticket pasándole los datos combinados
        if (window.TicketPrinter) {
            TicketPrinter.imprimir({
                ...payload,
                ...resultadoBackend
            });
        }

        document.getElementById('form-pago').reset();
        cargarDashboard();
        cargarSocios();
        cargarGraficas();
    } catch (err) {
        mensajeDiv.className = 'mt-3 p-3 text-xs rounded-lg text-center font-medium bg-red-100 text-red-800 border border-red-200';
        mensajeDiv.innerText = 'Error al registrar el pago. Verifique el código de socio.';
        mensajeDiv.classList.remove('hidden');
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
        cargarGraficas(); // Actualizar gráfica de horarios pico
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

    // Configuración global estética minimalista
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

    // Calcular hora pico
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
