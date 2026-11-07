const TicketPrinter = {
    imprimir(datosPago) {
        document.getElementById('t-folio').innerText = datosPago.folio || Math.floor(100000 + Math.random() * 900000);
        document.getElementById('t-fecha').innerText = new Date().toLocaleString('es-MX');
        document.getElementById('t-codigo').innerText = datosPago.codigoSocio;
        document.getElementById('t-nombre').innerText = datosPago.nombreSocio || datosPago.codigoSocio;
        document.getElementById('t-meses').innerText = datosPago.meses;
        document.getElementById('t-monto').innerText = `$${datosPago.monto.toFixed(2)}`;
        document.getElementById('t-metodo').innerText = datosPago.metodoPago;
        document.getElementById('t-vencimiento').innerText = datosPago.fechaMembresiaFin || 'Calculado por sistema';

        window.print();
    }
};