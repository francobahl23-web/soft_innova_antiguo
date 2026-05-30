// service-profesionales.js

const ProfesionalRepository = require('../3-repositories/Profesional');
const ProfesionalDTO = require('./DTO/ProfesionalDTO');
const { publishEvent } = require('./Event');

const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

const createProfesional = async (req, res) => {
    try { 
        const profesionalData = ProfesionalDTO.toDatabase(req.body);
        const result = await ProfesionalRepository.createProfesional(profesionalData);
        await ProfesionalRepository.createBloqueosFromHolidays([result.id]);
        res.ok(result);
    } catch (error) {
        res.failureResponse({ message: 'Error al crear profesional' });
    }
};

const getAllProfesionales = async (req, res) => {
    try {
        const result = await ProfesionalRepository.getAllProfesionales();
        if(req.user.rol==="profesional"){
           result = result.filter(r=>r.id == req.user.profesional.id);
        }
        res.ok({ data: result.map( (el) => ProfesionalDTO.fromDatabase(el) ) });
    } catch (error) {
        console.error(error);
        res.failureResponse({ message: 'Error al obtener profesionales' });
    }
};

const getProfesionalById = async (req, res) => {
    try {
        const profesionalId = req.params.id;
        const result = await ProfesionalRepository.getProfesionalById(profesionalId);
        
        if(req.user.rol==="profesional" && result.id != req.user.profesional.id){
            return res.failureResponse({ message: 'Error solo puede ver información suya' });
        }
        res.ok({data:ProfesionalDTO.fromDatabase(result)});
    } catch (error) {
        console.error(error);
        res.failureResponse({ message: 'Error al obtener profesional por ID' });
    }
};

const updateProfesional = async (req, res) => {
    try {
        const profesionalId = req.params.id;
        if(req.user.rol==="profesional" && result.id != req.user.profesional.id){
            return res.failureResponse({ message: 'Error solo puede actualizar su propia información' });
        }
        const profesionalData = ProfesionalDTO.toDatabase(req.body); 
        const result = await ProfesionalRepository.updateProfesional(profesionalId, profesionalData);
        res.ok({data:result});
    } catch (error) {
        console.error(error);
        res.failureResponse({ message: 'Error al actualizar profesional' });
    }
};

const deleteProfesional = async (req, res) => {
    try {
        const profesionalId = req.params.id;
        const result = await ProfesionalRepository.deleteProfesional(profesionalId);
        res.ok(result);
    } catch (error) {
        console.error(error);
        res.failureResponse({ message: 'Error al eliminar profesional' });
    }
};

const searchProfesional = async (req, res) => {
    try {
      let filtros = {
        searchValue: req.query.searchValue ? req.query.searchValue.trim() : null,
        dni: req.query.dni ? req.query.dni.trim() : null,
        nombre: req.query.nombres ? req.query.nombres.trim() : null,
        apellido: req.query.apellidos ? req.query.apellidos.trim() : null,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize) : null,
        page: req.query.page ? parseInt(req.query.page) : null,
      }
  
      if(req.user.rol==="profesional"){
        filtros.id = req.user.profesional.id;
     }
      // Validate pageSize and page
      if (filtros.pageSize && (isNaN(filtros.pageSize) || filtros.pageSize <= 0)) {
        return res.failureResponse({ message: 'Tamaño de pagina no valido.' });
      }
  
      if (filtros.page && (isNaN(filtros.page) || filtros.page <= 0)) {
        return res.failureResponse({ message: 'Pagina no valida.' });
      }
  
      let list = await ProfesionalRepository.search(filtros);
      res.ok({ data: list });
    } catch (e) {
      console.error(e);
      res.failureResponse({ message: 'Error al obtener los pacientes' });
    }
};


const createBloqueo = async (req, res) => {
    try {
        const BloqueoData = req.body;
        if(req.user.rol==="profesional" && BloqueoData.profesional_id != req.user.profesional.id){
            return res.failureResponse({ message: 'Error solo puede crear bloqueos para si mismo.' });
        }
        const result = await ProfesionalRepository.createBloqueo(BloqueoData);
        res.ok(result);
    } catch (error) {
        console.error(error);
        res.failureResponse({ message: error.message });
    }
};


const updateBloqueo = async (req, res) => {
    try {
        const BloqueoId = req.params.id;
        const BloqueoData = req.body;
        let bloqueo = await ProfesionalRepository.getBloqueoById(BloqueoId);
        if(req.user.rol==="profesional" && bloqueo.profesional_id != req.user.profesional.id){
            return res.failureResponse({ message: 'Solo puede eliminar sus propios bloqueos' });
        }
        const result = await ProfesionalRepository.updateBloqueo(BloqueoId, BloqueoData);
        res.ok(result);
    } catch (error) {
        console.error(error);
        res.failureResponse({ message: 'Error al actualizar Bloqueo' });
    }
};

const deleteBloqueo = async (req, res) => {
    try {
        const BloqueoId = req.params.id;
        let bloqueo = await ProfesionalRepository.getBloqueoById(BloqueoId);
        if(req.user.rol==="profesional" && bloqueo.profesional_id != req.user.profesional.id){
            return res.failureResponse({ message: 'Solo puede eliminar sus propios bloqueos' });
        }
        const result = await ProfesionalRepository.deleteBloqueo(BloqueoId);
        const start = new Date(bloqueo.fecha_hora_desde);
        const end =  new Date(bloqueo.fecha_hora_hasta);
        let fromDB = {
            id: bloqueo.id,
            doctor:`${bloqueo.profesional.apellido}, ${bloqueo.profesional.nombre}`,
            start,
            end
        };
        let {horarios,practica} = await ProfesionalRepository.getHorarioPractica(bloqueo.profesional_id,new Date(bloqueo.fecha_hora_desde),new Date(bloqueo.fecha_hora_hasta))
        publishEvent('actualizacion',{ modelo:"bloqueo",operation:'delete', data: fromDB ,horario:horarios,practica:practica});
        publishEvent( 'doctor-'+bloqueo.profesional_id,{modelo:"bloqueo",operation:'delete', data: fromDB ,horario:horarios,practica:practica});
        res.ok(bloqueo);
    } catch (error) {
        console.error(error);
        res.failureResponse({ message: 'Error al eliminar Bloqueo' });
    }
};

const getBloqueoById = async (req, res) => {
    try {
        const bloqueoId = req.params.id;
        const result = await ProfesionalRepository.getBloqueoById(bloqueoId);
        
        if(req.user.rol==="profesional" && result.profesional_id != req.user.profesional.id){
            return res.failureResponse({ message: 'Error solo puede ver sus bloqueos.' });
        }
        const start = new Date(result.fecha_hora_desde);
        const end =  new Date(result.fecha_hora_hasta);
        let fromDB = {
            id: result.id,
            profesional_id: result.profesional_id,
            doctor:`${result.profesional.apellido}, ${result.profesional.nombre}`,
            tipo: "bloqueo",
            start,
            end,
            text:result.motivo,
            hora: formatTime(start),
        }; 
        res.ok({data:fromDB});
    } catch (error) {
        console.error(error);
        res.failureResponse({ message: 'Error al obtener profesional por ID' });
    }
}; 
const createBloqueosForAllProfesionales = async () => {
    const profesionalIds = await ProfesionalRepository.getAllProfesionalesIds();
    await ProfesionalRepository.createBloqueosFromHolidays(profesionalIds);
};

module.exports = {
    create: createProfesional,
    getAll: getAllProfesionales,
    getById: getProfesionalById,
    update: updateProfesional,
    delete: deleteProfesional,
    search: searchProfesional,
    createBloqueo,
    updateBloqueo,
    deleteBloqueo,
    getBloqueoById,
    createBloqueosForAllProfesionales,
};
