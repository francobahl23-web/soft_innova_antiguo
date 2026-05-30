// service-Turnoes.js

const TurnoRepository = require('../3-repositories/Turno');

const TurnoDTO = require('./DTO/TurnoDTO'); 

const createTurno = async (req, res) => {
    try {
        if(req.user.rol==="profesional" && req.body.profesional_id !== req.user.profesional.id)
            return res.failureResponse({message: "Como profesional solo puede crear turnos a si mismo." });

        const TurnoData = req.body;
        TurnoData.usuario_id = req.user.id;
        TurnoData.created_by = req.user.id;
        const result = await TurnoRepository.createTurno(TurnoData);
        if(result.available)
            return res.ok({data:result});
        if(!result.available)
            res.failureResponse({ data: result.suggestions, message: result.message });
    } catch (error) {
        console.error(error);
        res.failureResponse({ message: error.message });
    }
};

const getAllTurnos = async (req, res) => {
    try {
        let result;
        if(req.user.rol==="profesional")
            result = await TurnoRepository.getAllTurnos(req.user.profesional.id);
        else
            result = await TurnoRepository.getAllTurnos();
        res.ok({data:result});
    } catch (error) {
        console.error(error);
        res.failureResponse({ message: 'Error al obtener Turnoes' });
    }
};

const getTurnoById = async (req, res) => {
    try {
        const TurnoId = req.params.id;
        const result = await TurnoRepository.getTurnoById(TurnoId);
        if(req.user.rol==="profesional" && result.profesional_id !== req.user.profesional.id)
            return res.failureResponse({message: "Como profesional solo puede ver turnos propios." });
        res.ok({data:TurnoDTO.fromDatabase(result)});
    } catch (error) {
        console.error(error);
        res.failureResponse({ message: 'Error al obtener Turno por ID' });
    }
};

const updateTurno = async (req, res) => {
    try {
        const TurnoId = req.params.id;
        const TurnoData = req.body;
        TurnoData.usuario_id = req.user.id;

        const aux = await TurnoRepository.getTurnoById(TurnoId);
        if(req.user.rol==="profesional" && aux.profesional_id !== req.user.profesional.id)
            return res.failureResponse({message: "Como profesional solo puede ver turnos propios." });
        
        const result = await TurnoRepository.updateTurno(TurnoId, TurnoData);
        if(result.available)
            res.ok({data:result});
        else
            res.failureResponse({ data: result.suggestions, message: result.message });
    } catch (error) {
        console.error(error);
        res.failureResponse({ message: error.toString()});
    }
};

const deleteTurno = async (req, res) => {
    try {
        const TurnoId = req.params.id;

        const aux = await TurnoRepository.getTurnoById(TurnoId);
        if(req.user.rol==="profesional" && aux.profesional_id !== req.user.profesional.id)
            return res.failureResponse({message: "Como profesional solo puede eliminar turnos propios." });
        
        const result = await TurnoRepository.deleteTurno(TurnoId);
        res.ok({data:result});
    } catch (error) {
        console.error(error);
        res.failureResponse({ message: 'Error al eliminar Turno' });
    }
};

module.exports = {
    create:createTurno,
    getAll:getAllTurnos,
    getById:getTurnoById,
    update:updateTurno,
    delete:deleteTurno
};
