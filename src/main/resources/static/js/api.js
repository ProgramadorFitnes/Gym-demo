const API_BASE = '/api/v1';

const ApiService = {
    async getResumenDashboard() {
        const res = await fetch(`${API_BASE}/dashboard/resumen`);
        return res.ok ? await res.json() : null;
    },

    async buscarSocios(query = '') {
        const endpoint = query ? `${API_BASE}/usuarios/buscar?query=${encodeURIComponent(query)}` : `${API_BASE}/usuarios/buscar`;
        const res = await fetch(endpoint);
        return res.ok ? await res.json() : [];
    },

    async registrarPago(payload) {
        const res = await fetch(`${API_BASE}/pagos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || 'Error al registrar el pago');
        }
        return await res.json().catch(() => ({}));
    },

    async getAccesos() {
        try {
            const res = await fetch(`${API_BASE}/acceso`);
            if (!res.ok) {
                console.warn(`Error al consultar accesos: HTTP ${res.status}`);
                return [];
            }
            return await res.json();
        } catch (error) {
            console.error('Error parseando o consultando accesos:', error);
            return [];
        }
    },

    async validarAcceso(codigoSocio) {
        const res = await fetch(`${API_BASE}/acceso?codigoSocio=${encodeURIComponent(codigoSocio)}`, {
            method: 'POST'
        });

        const texto = await res.text();
        return { ok: res.ok, status: res.status, mensaje: texto };
    },

    async crearUsuario(usuarioData) {
        const res = await fetch(`${API_BASE}/usuarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(usuarioData)
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Error en registro: ${errorText}`);
        }
        return await res.json().catch(() => ({}));
    },

    // Endpoints para Planes de Membresía (CRUD Dinámico)
    async getPlanes(soloActivos = true) {
        try {
            const res = await fetch(`${API_BASE}/planes?soloActivos=${soloActivos}`);
            return res.ok ? await res.json() : [];
        } catch (error) {
            console.error('Error al obtener planes de membresía:', error);
            return [];
        }
    },

    async crearPlan(planData) {
        const res = await fetch(`${API_BASE}/planes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(planData)
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || 'Error al crear plan');
        }
        return await res.json();
    },

    async actualizarPlan(id, planData) {
        const res = await fetch(`${API_BASE}/planes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(planData)
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || 'Error al actualizar plan');
        }
        return await res.json();
    },

    async desactivarPlan(id) {
        const res = await fetch(`${API_BASE}/planes/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || 'Error al desactivar plan');
        }
        return await res.text();
    },

    // Endpoints para analíticas (Chart.js)
    async getIngresosMensuales() {
        try {
            const res = await fetch(`${API_BASE}/dashboard/ingresos-mensuales`);
            return res.ok ? await res.json() : [];
        } catch (error) {
            console.error('Error al obtener ingresos mensuales:', error);
            return [];
        }
    },

    async getHorariosPico() {
        try {
            const res = await fetch(`${API_BASE}/dashboard/horarios-pico`);
            return res.ok ? await res.json() : [];
        } catch (error) {
            console.error('Error al obtener horarios pico:', error);
            return [];
        }
    },

    async getEstadoMembresias() {
        try {
            const res = await fetch(`${API_BASE}/dashboard/estado-membresias`);
            return res.ok ? await res.json() : null;
        } catch (error) {
            console.error('Error al obtener estado de membresías:', error);
            return null;
        }
    },

    async getMetodosPago() {
        try {
            const res = await fetch(`${API_BASE}/dashboard/metodos-pago`);
            return res.ok ? await res.json() : [];
        } catch (error) {
            console.error('Error al obtener métodos de pago:', error);
            return [];
        }
    }
};
