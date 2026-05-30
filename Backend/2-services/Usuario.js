const UsuarioRepository = require('../3-repositories/Usuario');
const {encrypt} = require('../1-routes/middleware/crypto');
const { JWT_SECRET } = require('../constants/authConstant'); // Asegúrate de tener la configuración correcta
const jwt = require('jsonwebtoken');


const createUsuario = async (req, res) => {
    try {
        const repeated = await UsuarioRepository.getUsuarioByUsername(req.body.username);
        if(repeated){
            return res.failureResponse({message:"Ya existe un usuario con ese nombre de usuario."})
        }
        const usuario = await UsuarioRepository.createUsuario(req.body);
        res.ok({ message: 'Usuario creado exitosamente', data: usuario });
    } catch (error) {
        res.failureResponse({ message: error.message });
    }
};

const getAllUsuarios = async (req, res) => {
    try {
        const usuarios = await UsuarioRepository.getAllUsuarios();
        res.ok({ data: usuarios });
    } catch (error) {
        res.failureResponse({ message: error.message });
    }
};

const getUsuarioById = async (req, res) => {
    try {
        const usuario = await UsuarioRepository.getUsuarioById(req.params.id);
        if (!usuario) {
            return res.recordNotFound({ message: 'Usuario no encontrado' });
        }

        if(req.user.rol === "profesional" && (!usuario.profesional || usuario.profesional.id!=req.user.profesional.id)){
            return res.failureResponse({ message: 'Error solo puede ver información de su propio usuario' });
        }

        if(req.user.rol === "secretaria" && (usuario.id  != req.user.id)){
            return res.failureResponse({ message: 'Error solo puede ver información de su propio usuario' });
        }

        res.ok({ data: usuario });
    } catch (error) {
        res.failureResponse({ message: error.message });
    }
};

const updateUsuario = async (req, res) => {
    try {
        const repeated = await UsuarioRepository.getUsuarioByUsername(req.body.username);
        if(repeated && repeated.id != req.params.id){
            return res.failureResponse({message:"Ya existe un usuario con ese nombre de usuario."})
        }
        
        if(req.user.rol === "profesional" && (!repeated.profesional || repeated.profesional.id!=req.user.profesional.id)){
            return res.failureResponse({ message: 'Error solo puede actualizar información de su propio usuario' });
        }

        if(req.user.rol === "secretaria" && (usuario.id  != req.user.id)){
            return res.failureResponse({ message: 'Error solo puede ver información de su propio usuario' });
        }
        const usuario = await UsuarioRepository.updateUsuario(req.params.id, req.body);
        res.ok({ message: 'Usuario actualizado exitosamente', data: usuario });
    } catch (error) {
        res.failureResponse({ message: error.message });
    }
};

const deleteUsuario = async (req, res) => {
    try {
        await UsuarioRepository.deleteUsuario(req.params.id);
        res.ok({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        res.failureResponse({ message: error.message });
    }
};

const assignPermissions = async (req, res) => {
    try {
        await UsuarioRepository.assignPermissions(req.params.id, req.body.permissions);
        res.ok({ message: 'Permisos asignados correctamente' });
    } catch (error) {
        res.failureResponse({ message: error.message });
    }
};

const changePassword = async (req, res) => {
    try {
        const { password } = req.body;
        await UsuarioRepository.changePassword(req.userId, password);
        res.ok({ message: 'Contraseña cambiada correctamente' });
    } catch (error) {
        res.failureResponse({ message: error.message });
    }
};

const changeUserPassword = async (req, res) => {
    try {
        const { password } = req.body;
        await UsuarioRepository.changePassword(req.params.id, password);
        res.ok({ message: 'Contraseña cambiada correctamente' });
    } catch (error) {
        res.failureResponse({ message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const usuario= await UsuarioRepository.login(username, password);
        res.loginSuccess({ 
            data:encrypt(usuario) 
        });
    } catch (error) {
        res.loginFailed({ message: error.message });
    }
};


const authorize = (requiredPermisos) => {
    return async (req, res, next) => {
        try {
            let token = req.headers['authorization'];
            token = token.replace("Bearer ", "");
            
            if (!token) {
                return res.unAuthorizedRequest({ message: 'Token no proporcionado' });
            }

            jwt.verify(token, JWT_SECRET, async (err, decoded) => {
                if (err) {
                    return res.unAuthorizedRequest({ message: 'Token inválido' });
                }

                const usuario = await UsuarioRepository.getUsuarioById(decoded.id);
                if (!usuario) {
                    return res.unAuthorizedRequest({ message: 'Usuario no encontrado' });
                }

                const permisosUsuario = usuario.permisos.map(p => p.permiso);
                const hasPermission = requiredPermisos.every(permiso => permisosUsuario.includes(permiso));

                if (!hasPermission) {
                    return res.unAuthorizedRequest({ message: 'No autorizado' });
                } 

                req.user =usuario;
                next();
            });
        } catch (error) {
            return res.failureResponse({ message: error.message });
        }
    };
};

module.exports = {
    createUsuario,
    getAllUsuarios,
    getUsuarioById,
    updateUsuario,
    deleteUsuario,
    assignPermissions,
    changePassword,
    changeUserPassword,
    login,
    authorize
};
