const TurnoService = require('../2-services/Turno');
const { authorize } = require('../2-services/Usuario');

module.exports = function (router) {
    router.post('/turnos', authorize(['crear_turnos']), TurnoService.create);
    router.get('/turnos', authorize(['ver_turnos']), TurnoService.getAll);
    router.get('/turnos/:id', authorize(['ver_turnos']), TurnoService.getById);
    router.put('/turnos/:id', authorize(['modificar_turnos']), TurnoService.update);
    router.delete('/turnos/:id', authorize(['eliminar_turnos']), TurnoService.delete);
};
