// DTO/PacienteDTO.js
const TurnoDTO = require('./TurnoDTO'); 
class PacienteDTO {
    static toDatabase(paciente) {
        let generoDB;

        if(paciente.genero)
        {
            if(typeof paciente.genero == "object")
                paciente.genero = paciente.genero.value?paciente.genero.value:"";
            switch (paciente.genero.toLowerCase()) {
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
        }

        return {
            nombre: paciente.nombre,
            apellido: paciente.apellido,
            dni: paciente.dni,
            genero: generoDB,
            fecha_nacimiento: paciente.fecha_nacimiento, 
            obra_social: paciente.obraSocial,
            contactos: paciente.contactos || [], // Si no se proporcionan contactos, se establece como un array vacío
            
            coberturas: paciente.coberturas ? paciente.coberturas.map(i=>{
                return {
                    nombre: i.nombre, 
                    nro_cobertura: i.numero, 
                }
            }) : [], // Si no hay coberturas, se establece como []coberturas: paciente.coberturas || [], // Si no se proporcionan coberturas, se establece como un array vacío
            turnos: paciente.turnos || [], // Si no se proporcionan turnos, se establece como un array vacío
            historial: paciente.historial || [] // Si no se proporcionan historial, se establece como un array vacío
        };
    } 

    static fromDatabase(paciente) {
        let generoFront;
        switch (paciente.genero) {
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

        return {
            id: paciente.id,
            nombre: paciente.nombre,
            apellido: paciente.apellido,
            dni: paciente.dni,
            genero: generoFront,
            fecha_nacimiento: paciente.fecha_nacimiento, 
            emails:paciente.contactos? paciente.contactos.filter(p=>p.tipo==="email"):[],
            telefonos:paciente.contactos? paciente.contactos.filter(p=>p.tipo.includes("telefono")):[],
            obraSocial: paciente.obra_social,
            contactos: paciente.contactos   ? paciente.contactos.map(i=>{
                return {
                    id:i.id,
                    tipo:i.tipo,
                    valor:i.valor,
                }
            }) : [], // Si no hay contactos, se establece como []
            coberturas: paciente.coberturas ? paciente.coberturas.map(i=>{
                return {
                    id:i.id, 
                    nombre:i.nombre, 
                    numero:i.PacienteCobertura.nro_cobertura, 
                }
            }) : [], // Si no hay coberturas, se establece como []
            turnos: paciente.turnos?paciente.turnos.map(e=>{
                        e.paciente = {
                            dni:paciente.dni,
                            nombre: paciente.nombre,
                            apellido: paciente.apellido,
                            contactos: paciente.contactos,
                            coberturas: paciente.coberturas
                        }
                        return TurnoDTO.fromDatabase(e)
                    }): [], // Si no hay turnos, se establece como []
            historial: paciente.historial? paciente.historial.map(h=>({
                    fecha: h.fecha_hora,
                    practica: h.turno.practica? h.turno.practica.nombre: '',
                    doctor: h.turno.profesional? `${profesional.apellido}, ${profesional.nombre}`: '',
                    mensaje: h.mensaje
            })) : [] // Si no hay historial, se establece como []
        };
        
    }
}

module.exports = PacienteDTO;
