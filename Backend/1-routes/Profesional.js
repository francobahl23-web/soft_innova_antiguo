const ProfesionalService = require('../2-services/Profesional');
const { authorize } = require('../2-services/Usuario');

module.exports = function (router) {
    router.post('/profesionales', authorize(['crear_profesionales']), ProfesionalService.create);
    router.get('/profesionales', authorize(['ver_profesionales']), ProfesionalService.getAll);
    router.get('/profesionales/search', authorize(['ver_profesionales']), ProfesionalService.search);
    router.get('/profesionales/:id', authorize(['ver_profesionales']), ProfesionalService.getById);
    router.put('/profesionales/:id', authorize(['modificar_profesionales']), ProfesionalService.update);
    router.delete('/profesionales/:id', authorize(['eliminar_profesionales']), ProfesionalService.delete);
    
    router.post('/bloqueo', authorize(['crear_bloqueos']), ProfesionalService.createBloqueo);
    router.put('/bloqueo/:id', authorize(['modificar_bloqueos']), ProfesionalService.updateBloqueo);
    router.delete('/bloqueo/:id', authorize(['eliminar_bloqueos']), ProfesionalService.deleteBloqueo);
    router.get('/bloqueo/:id', authorize(['ver_bloqueos']), ProfesionalService.getBloqueoById);
};
