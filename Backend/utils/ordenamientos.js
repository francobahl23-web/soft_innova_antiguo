function compareLeads(leadA, leadB) {
    // Comparación por grupoInterno (true primero)
    const grupoInternoComparison = -1*(leadB.grupoInterno - leadA.grupoInterno);

    if (grupoInternoComparison !== 0) {
        return grupoInternoComparison;
    }

    const estadoOrder = {
        'APROBADO': 1,
        'OBSERVACION': 2,
        'SCORING PENDIENTE': 3,
        'SIN CONTACTO': 4,
        'CONTRATO ANULADO': 5,
        'BAJA': 6,
        'RECHAZADO': 7
    };

    // Comparación por estado
    const estadoComparison = estadoOrder[leadB.estado] - estadoOrder[leadA.estado];

    if (estadoComparison !== 0) {
        return estadoComparison;
    }
    if(leadA.grupoInterno===0)
        return 0;

    // Si el estado es APROBADO para ambos leads, se compara por contrato
    if (leadA.estado === 'APROBADO' && leadB.estado === 'APROBADO') {
        const contratoComparison = compareContratoState(leadA.contrato, leadB.contrato);
        return contratoComparison !== 0 ? contratoComparison : estadoComparison;
    }
    // Comparación por fechas si ha pasado todos los anteriores
    const fechaComparison = new Date(leadB.fechaIngreso) - new Date(leadA.fechaIngreso);
    return fechaComparison !== 0 ? fechaComparison : estadoComparison;

}

function compareContratoState(contratoA, contratoB) {
    const contratoOrder = {
        'P. RETIRO': 1,
        'ACTIVO': 2,
        'INTEGRO': 3,
        'CANCELO MOTO': 4,
        'EN CALLE': 5,
        'FINALIZADO-externo': 6,
        'FINALIZADO-credito-int': 7,
        'BAJA': 8,
    };
    // Comparación por contrato
    return contratoOrder[contratoB.estado] - contratoOrder[contratoA.estado];
}

function compareCuota(cuotaA,cuotaB) {
    const cuotaOrder = {
        'PENDIENTE-APROBACION': 1,
        'MORA': 2,
        'PENDIENTE-EMISION': 3,
        'EMITIDO': 4,
        'ADELANTADA': 5,
        'APROBADO': 6
    };
    // Comparación por contrato
    return cuotaOrder[cuotaB.estado] - cuotaOrder[cuotaA.estado];
}

function compareContrato(contratoA,contratoB) {
    let cont = compareContratoState(contratoA,contratoB);
    if(cont === 0){
        if (contratoA.cuotas.length === 0 || contratoB.cuotas.length === 0) {
            // Comparar por fecha de alta en orden ascendente (contrato más antiguo primero)
            let diff = contratoA.cuotas.length - contratoB.cuotas.length;
            if (diff !== 0)
                return diff;
            return contratoA.fechaAlta - contratoB.fechaAlta;
        }
        let ultA = contratoA.cuotas.sort((a,b)=>{return b.numeroCuota - a.numeroCuota})[0]
        let ultB = contratoB.cuotas.sort((a,b)=>{return b.numeroCuota - a.numeroCuota})[0]

        return compareCuota(ultA,ultB)
    }
    return cont;
}
///////////// QUICKSORT  (GANO) //////////////////////////////////////////////////////////////////////////////7
function quicksortLeads(leads) {
    if (leads.length <= 1) {
        return leads;
    }

    const pivotIndex = Math.floor(leads.length / 2);
    const pivot = leads[pivotIndex];
    const left = [];
    const right = [];

    for (let i = 0; i < leads.length; i++) {
        if (i === pivotIndex) {
            continue;
        }

        if (compareLeads(leads[i], pivot) >= 0) {
            left.push(leads[i]);
        } else {
            right.push(leads[i]);
        }
    }

    return [...quicksortLeads(left), pivot, ...quicksortLeads(right)];
}///////////// QUICKSORT  (GANO) //////////////////////////////////////////////////////////////////////////////7
function quicksortContrato(contrato) {
    if (contrato.length <= 1) {
        return contrato;
    }

    const pivotIndex = Math.floor(contrato.length / 2);
    const pivot = contrato[pivotIndex];
    const left = [];
    const right = [];

    for (let i = 0; i < contrato.length; i++) {
        if (i === pivotIndex) {
            continue;
        }

        if (compareContrato(contrato[i], pivot) >= 0) {
            left.push(contrato[i]);
        } else {
            right.push(contrato[i]);
        }
    }

    return [...quicksortContrato(left), pivot, ...quicksortContrato(right)];
}

module.exports = {
    quicksortLeads,quicksortContrato
}

