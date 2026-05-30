class TurnoDTO {
    static fromDatabase(turno){

        return {
            idPaciente: turno.paciente ? turno.paciente.id : null,
            nombre : this.formatNombre(turno.paciente),
            fecha : turno.fecha_hora,
            horario : this.formatHorario(turno.fecha_hora),
            telefono : this.getTelefono(turno.paciente?.contactos),
            dni : this.formatDNI(turno.paciente?.dni),
            obraSocial : this.formatObraSocial(turno.paciente?.coberturas),
            id : turno.id,  
            profesional_id : turno.profesional_id, 
            practica_id : turno.practica ? turno.practica.id : null,  
            tipo : turno.tipo,  
            duracion : turno.duracion,  
            practica : this.getPractica(turno.practica),   
            doctor : this.formatDoctor(turno.profesional),
            estado : this.formatEstado(turno.estado),
            historial : this.formatHistorial(turno),
            historial_cambios : turno.historial_cambios,
            ultimaModificacion : turno.updatedAt,
            nota: turno.nota  
        }
    }

    static formatHistorial(turno) {
        return turno.historial? turno.historial.map(h=>({
            fecha: h.fecha_hora,
            mensaje: h.mensaje,
            practica: turno.practica? turno.practica.nombre: '',
            doctor: turno.profesional? `${profesional.apellido}, ${profesional.nombre}`: '',
    })) : []
    }
    static formatNombre(paciente) {
        return `${paciente?.apellido}, ${paciente?.nombre}`;
    }

    static formatHorario(fecha_hora) {
        const date = new Date(fecha_hora);
        return date.toTimeString().split(' ')[0].slice(0, 5);
    }

    static getTelefono(contactos) {
        const telefono = contactos?.find(contacto => contacto.tipo === 'telefono');
        return telefono ? telefono.valor : '';
    }

    static formatDNI(dni) {
        return dni ? dni.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3') : '';
    }

    static formatObraSocial(coberturas) {
        if(coberturas && coberturas.length>0){
            return  `${coberturas[0].nombre} ${coberturas[0].numero ? '- ' + coberturas[0].numero : ''}`;
        }
        return '';
    }
 
    static getPractica(practica) {
        return practica? practica.nombre: '-';
    }

    static formatDoctor(profesional) {
        return `${profesional?.apellido}, ${profesional?.nombre}`;
    }

    static formatEstado(estado) { 
        return estado;
    }
}

module.exports = TurnoDTO;
