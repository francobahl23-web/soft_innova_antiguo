const PacienteService = require('../2-services/Paciente');
const { authorize } = require('../2-services/Usuario');

module.exports = function (router) {
    router.post('/pacientes', authorize(['crear_pacientes']), PacienteService.create);
    router.get('/pacientes', authorize(['ver_pacientes']), PacienteService.getAll);
    router.get('/pacientes/search', authorize(['ver_pacientes']), PacienteService.search);
    router.get('/pacientes/:id', authorize(['ver_pacientes']), PacienteService.getById);
    router.put('/pacientes/:id', authorize(['modificar_pacientes']), PacienteService.update);
    router.delete('/pacientes/:id', authorize(['eliminar_pacientes']), PacienteService.delete);
};
