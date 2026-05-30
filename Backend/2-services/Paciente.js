// services/service-pacientes.js

const PacienteRepository = require('../3-repositories/Paciente');
const PacienteDTO = require('./DTO/PacienteDTO');
const { publishEvent } = require('../2-services/Event');

const createPaciente = async (req, res) => {
    try {
        // Verificar propiedades obligatorias
        const requiredProps = ['nombre', 'apellido'];
        for (const prop of requiredProps) {
            if (!req.body[prop]) {
                return res.badRequest({ message: `${prop} es obligatorio` });
            }
        }

        const pacienteData = PacienteDTO.toDatabase(req.body);
        result = await PacienteRepository.create(pacienteData);

        res.ok({data:PacienteDTO.fromDatabase(result)});
    } catch (error) {
        console.error(error);
        res.failureResponse({ message: 'Error al crear paciente' });
    }
};

const updatePaciente = async (req, res) => {
    try {
        const pacienteId = req.params.id;
        const pacienteData = PacienteDTO.toDatabase(req.body);
        const { pacienteActualizado, cambios } = await PacienteRepository.update(pacienteId, pacienteData);
        if(Object.keys(cambios).length >0){
            publishEvent('paciente',{ modelo:"paciente", operation:'update',cambios });
        }
        res.ok({data:PacienteDTO.fromDatabase(pacienteActualizado)});
    } catch (error) {
        console.error(error);
        res.failureResponse({ message: 'Error al actualizar paciente' });
    }
};

const deletePaciente = async (req, res) => {
    try {
        const pacienteId = req.params.id;
        await PacienteRepository.remove(pacienteId);
        res.ok({ message: 'Paciente eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.failureResponse({ message: 'Error al eliminar paciente' });
    }
};

const getAllPacientes = async (req, res) => {
    try {
        const result = await PacienteRepository.getAll();
        res.ok({data:result.map(PacienteDTO.fromDatabase)});
    } catch (error) {
        console.error(error);
        res.failureResponse({ message: 'Error al obtener pacientes' });
    }
};

const getPacienteById = async (req, res) => {
    try {
        const pacienteId = req.params.id;
        const result = await PacienteRepository.getById(pacienteId); 
        if (!result) {
            return res.recordNotFound({ message: 'Paciente no encontrado' });
        }
        res.ok({data:PacienteDTO.fromDatabase(result)});
    } catch (error) {
        console.error(error);
        res.failureResponse({ message: 'Error al obtener paciente por ID' });
    }
};

const searchPaciente = async (req, res) => {
    try {
      let filtros = {
        searchValue: req.query.searchValue ? req.query.searchValue.trim() : null,
        dni: req.query.dni ? req.query.dni.trim() : null,
        nombre: req.query.nombres ? req.query.nombres.trim() : null,
        apellido: req.query.apellidos ? req.query.apellidos.trim() : null,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize) : null,
        page: req.query.page ? parseInt(req.query.page) : null,
      }
  
      // Validate pageSize and page
      if (filtros.pageSize && (isNaN(filtros.pageSize) || filtros.pageSize <= 0)) {
        return res.failureResponse({ message: 'Tamaño de pagina no valido.' });
      }
  
      if (filtros.page && (isNaN(filtros.page) || filtros.page <= 0)) {
        return res.failureResponse({ message: 'Pagina no valida.' });
      }
      
      let list = await PacienteRepository.search(filtros);
      res.ok({ data: list });
    } catch (e) {
      console.error(e);
      res.failureResponse({ message: 'Error al obtener los pacientes' });
    }
};

module.exports = {
    create: createPaciente,
    update: updatePaciente,
    delete: deletePaciente,
    getAll: getAllPacientes,
    getById: getPacienteById,
    search: searchPaciente,
};
