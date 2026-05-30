// DTO/ProfesionalDTO.js

class ProfesionalDTO {
    static toDatabase(profesional) {
        let generoDB;
        switch (profesional.genero.toLowerCase()) {
            case 'masculino':
                generoDB = 'M';
                break;
            case 'femenino':
                generoDB = 'F';
                break;
            case 'otro':
                generoDB = 'O';
                break;
            default:
                generoDB = null;
        }

        const horarios = [];

        const dias = {
            'L': 'lunes',
            'M': 'martes',
            'X': 'miércoles',
            'J': 'jueves',
            'V': 'viernes',
            'S': 'sábado',
            'D': 'domingo'
        };

        for (const [key, value] of Object.entries(profesional.horarios)) {
            if (dias[key]) {
                value.forEach(horario => {
                    horarios.push({
                        dia: dias[key],
                        hora_inicio: horario.start,
                        hora_fin: horario.end
                    });
                });
            }
        }

        return {
            nombre: profesional.nombre.toLowerCase(),
            apellido: profesional.apellido.toLowerCase(),
            id: profesional.id,
            dni: profesional.dni,
            genero: generoDB,
            fecha_nacimiento: profesional.fecha_nacimiento,
            horarios: horarios,
            clinicas: profesional.clinicas ? profesional.clinicas.map(nombre => ({
                nombre: nombre.toLowerCase(),
            })) : [],
            contactos: profesional.contactos ? profesional.contactos.map(contacto => ({
                id: contacto.id,
                tipo: contacto.tipo,
                valor: contacto.valor
            })) : [],
            coberturas: profesional.obrasSociales ? profesional.obrasSociales.map(nombre => ({
                nombre: nombre.toLowerCase()
            })) : [],
            practicas: profesional.practicas ? profesional.practicas.map(practica => ({
                id: practica.id,
                nombre: practica.nombre.toLowerCase(),
                duracion_moda: practica.duracion_moda ? practica.duracion_moda : "00:30:00"
            })) : []
        };
    }

    static fromDatabase(profesional) {
        let generoFront;

        if(!profesional)
            return null

        switch (profesional.genero) {
            case 'M':
                generoFront = 'masculino';
                break;
            case 'F':
                generoFront = 'femenino';
                break;
            case 'O':
                generoFront = 'otro';
                break;
            default:
                generoFront = null;
        }

        const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);

        const horarios = {
            'L': [],
            'M': [],
            'X': [],
            'J': [],
            'V': [],
            'S': [],
            'D': []
        };

        profesional.horarios.forEach(horario => {
            let dia = horario.dia[0].toUpperCase(); // Primera letra del día
            if(horario.dia==="miércoles")
                dia = 'X';
            if (horarios[dia]) {
                horarios[dia].push({
                    start: horario.hora_inicio,
                    end: horario.hora_fin
                });
            }
        });

        return {
            nombre: capitalizeFirstLetter(profesional.nombre),
            apellido: capitalizeFirstLetter(profesional.apellido),
            dni: profesional.dni,
            id: profesional.id,
            genero: capitalizeFirstLetter(generoFront),
            fecha_nacimiento: profesional.fecha_nacimiento,
            horarios: horarios,
            emails: profesional.contactos ? profesional.contactos.filter(contacto => contacto.tipo === 'email').map(contacto => contacto.valor) : [],
            telefonos: profesional.contactos ? profesional.contactos.filter(contacto => contacto.tipo.includes("telefono")).map(contacto => contacto.valor) : [],
            coberturas: profesional.coberturas ? profesional.coberturas.map(cobertura => capitalizeFirstLetter(cobertura.nombre)) : [],
            clinicas: profesional.clinicas ? profesional.clinicas.map(clinica => ({ id: clinica.id, nombre: capitalizeFirstLetter(clinica.nombre) })) : [],
            contactos: profesional.contactos ? profesional.contactos.map(contacto => ({
                id: contacto.id,
                tipo: contacto.tipo,
                valor: contacto.valor
            })) : [],
            practicas: profesional.practicas ? profesional.practicas.map(practicaProfesional => ({
                id: practicaProfesional.practica.id,
                nombre: capitalizeFirstLetter(practicaProfesional.practica.nombre),
                duracion_moda: minutesToTime(practicaProfesional.duracion)
            })) : []
        };
    }
}

const minutesToTime = (duracion) => {
    let hours = Math.floor(duracion / 60);
    if (hours <= 9) {
        hours = "0" + hours;
    }
    let minutes = duracion % 60;
    if (minutes <= 9) {
        minutes = "0" + minutes;
    }
    return `${hours}:${minutes}`;
};

module.exports = ProfesionalDTO;
