const CalendarioService = require('../2-services/Calendario');
const { authorize } = require('../2-services/Usuario');

module.exports = function (router) {
    router.get('/calendario/disponibilidad/:cant_dias', authorize(['ver_turnos']), CalendarioService.consultarDisponibilidad);
};
