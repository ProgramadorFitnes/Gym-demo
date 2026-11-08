const TicketPrinter = {
    imprimir(datosPago) {
        document.body.classList.remove('imprimiendo-corte');
        document.body.classList.add('imprimiendo-ticket');

        const setTxt = (id, txt) => {
            const el = document.getElementById(id);
            if (el) el.innerText = txt;
        };

        setTxt('t-folio', datosPago.folio || Math.floor(100000 + Math.random() * 900000));
        setTxt('t-fecha', new Date().toLocaleString('es-MX'));
        setTxt('t-codigo', datosPago.codigoSocio || '---');
        setTxt('t-nombre', datosPago.nombreSocio || datosPago.codigoSocio || 'Socio');
        setTxt('t-meses', datosPago.nombrePlan || (datosPago.meses ? `${datosPago.meses} mes(es)` : 'Membresía'));
        
        const montoNum = Number(datosPago.monto);
        setTxt('t-monto', !isNaN(montoNum) ? `$${montoNum.toFixed(2)}` : '$0.00');
        setTxt('t-metodo', datosPago.metodoPago || 'EFECTIVO');
        setTxt('t-vencimiento', datosPago.fechaMembresiaFin || 'Vigencia actualizada');

        const cleanup = () => {
            document.body.classList.remove('imprimiendo-ticket');
            window.removeEventListener('afterprint', cleanup);
        };
        window.addEventListener('afterprint', cleanup);

        window.print();

        setTimeout(() => document.body.classList.remove('imprimiendo-ticket'), 2000);
    },

    imprimirCorte(datosCorte) {
        document.body.classList.remove('imprimiendo-ticket');
        document.body.classList.add('imprimiendo-corte');

        const setTxt = (id, txt) => {
            const el = document.getElementById(id);
            if (el) el.innerText = txt;
        };

        const formatoMoneda = (val) => {
            const num = Number(val) || 0;
            return `$${num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        };

        setTxt('tc-fecha-hora', datosCorte.fechaHora || new Date().toLocaleString('es-MX'));
        setTxt('tc-responsable', datosCorte.usuarioResponsable || 'Recepcionista General');
        setTxt('tc-fondo-inicial', formatoMoneda(datosCorte.fondoInicial));
        setTxt('tc-cobrado-efectivo', formatoMoneda(datosCorte.totalEfectivo));
        setTxt('tc-cobrado-tarjeta', formatoMoneda(datosCorte.totalTarjeta));
        setTxt('tc-cobrado-transferencia', formatoMoneda(datosCorte.totalTransferencia));
        setTxt('tc-total-ingresos', formatoMoneda(datosCorte.totalIngresos));
        setTxt('tc-esperado-efectivo', formatoMoneda(datosCorte.totalEsperadoEfectivo));
        setTxt('tc-real-efectivo', formatoMoneda(datosCorte.efectivoReal));

        const difNum = Number(datosCorte.diferencia) || 0;
        const signo = difNum > 0 ? '+ ' : (difNum < 0 ? '- ' : '');
        setTxt('tc-diferencia', `${signo}${formatoMoneda(Math.abs(difNum))}`);

        setTxt('tc-observaciones', datosCorte.observaciones || 'Sin observaciones');
        setTxt('tc-transacciones', `${datosCorte.cantidadTransacciones || 0} movimientos`);

        // Rellenar lista resumida de cobros en el ticket
        const tbody = document.getElementById('tc-lista-pagos');
        if (tbody) {
            tbody.innerHTML = '';
            const pagos = datosCorte.pagosHoy || [];
            if (pagos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #666;">Sin movimientos hoy</td></tr>';
            } else {
                pagos.forEach(p => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${p.codigoSocio || '---'}</td>
                        <td>${p.metodoPago ? p.metodoPago.substring(0, 4) : 'EFEC'}</td>
                        <td style="text-align: right;">${formatoMoneda(p.monto)}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        }

        const cleanup = () => {
            document.body.classList.remove('imprimiendo-corte');
            window.removeEventListener('afterprint', cleanup);
        };
        window.addEventListener('afterprint', cleanup);

        window.print();

        setTimeout(() => document.body.classList.remove('imprimiendo-corte'), 2000);
    }
};
