const TicketPrinter = {
    imprimir(datosPago) {
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

        window.print();
    }
};
