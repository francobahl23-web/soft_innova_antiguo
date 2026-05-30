const UsuarioService = require('../2-services/Usuario');
const {decrypt} = require('./middleware/crypto')
module.exports = function (router) {
    router.post('/usuarios', UsuarioService.authorize(['administrar_usuarios']), UsuarioService.createUsuario);
    router.get('/usuarios', UsuarioService.authorize(['administrar_usuarios']), UsuarioService.getAllUsuarios);
    router.get('/usuarios/:id', UsuarioService.authorize(['ver_usuarios']), UsuarioService.getUsuarioById);
    router.put('/usuarios/:id', UsuarioService.authorize(['editar_usuarios']), UsuarioService.updateUsuario);
    router.delete('/usuarios/:id', UsuarioService.authorize(['administrar_usuarios']), UsuarioService.deleteUsuario);

    router.post('/usuarios/:id/permisos', UsuarioService.authorize(['administrar_usuarios']), UsuarioService.assignPermissions);
    router.post('/usuarios/cambiar-password', UsuarioService.authorize([]), UsuarioService.changePassword);
    router.post('/usuarios/:id/cambiar-password', UsuarioService.authorize(['administrar_usuarios']), UsuarioService.changeUserPassword);

    router.post('/login',decrypt, UsuarioService.login);
};
