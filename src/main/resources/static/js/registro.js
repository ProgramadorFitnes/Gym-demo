document.addEventListener('DOMContentLoaded', () => {
    const chkEmpleado = document.getElementById('esEmpleado');
    const formRegistro = document.getElementById('formRegistro');

    chkEmpleado.addEventListener('change', alternarSeccionPago);
    formRegistro.addEventListener('submit', manejarRegistro);
});

function alternarSeccionPago() {
    const esEmpleado = document.getElementById('esEmpleado').checked;
    const seccionPago = document.getElementById('seccionPago');
    seccionPago.classList.toggle('hidden', esEmpleado);
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

        // 2. Si no es staff, cobrar e imprimir comprobante
        if (!esEmpleado) {
            const monto = parseFloat(document.getElementById('monto').value);
            const meses = parseInt(document.getElementById('meses').value) || 1;
            const metodoPago = document.getElementById('metodoPago').value;

            const pagoData = {
                codigoSocio,
                monto: isNaN(monto) ? 0 : monto,
                metodoPago,
                meses
            };

            const resultadoPago = await ApiService.registrarPago(pagoData);

            // Reutilizamos el mismo módulo de impresión térmica
            TicketPrinter.imprimir({
                codigoSocio,
                nombreSocio: `${nombre} ${apellido}`,
                monto,
                meses,
                metodoPago,
                fechaMembresiaFin: resultadoPago.fechaMembresiaFin
            });
        }

        // Feedback positivo
        respuestaDiv.classList.remove('hidden');
        respuestaDiv.className = 'p-4 rounded-lg text-sm font-medium text-center bg-green-100 text-green-800 border border-green-200';
        respuestaDiv.innerHTML = `<i class="fa-solid fa-circle-check text-green-600 me-2"></i> ${
            esEmpleado ? 'Empleado registrado con éxito.' : '¡Socio registrado, cobrado y ticket emitido!'
        }`;

        document.getElementById('formRegistro').reset();
        alternarSeccionPago();
        document.getElementById('codigoSocio').focus();

    } catch (error) {
        respuestaDiv.classList.remove('hidden');
        respuestaDiv.className = 'p-4 rounded-lg text-sm font-medium text-center bg-red-100 text-red-800 border border-red-200';
        respuestaDiv.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-red-600 me-2"></i> ${error.message}`;
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Registrar y Cobrar`;
    }
}