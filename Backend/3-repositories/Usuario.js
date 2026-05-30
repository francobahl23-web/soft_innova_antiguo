const { Usuario, Permiso, UsuarioPermiso,Profesional,sequelize } =  require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET, WS_TOKEN_SECRET, permisosSecretaria, permisos } = require('../constants/authConstant'); // Asegúrate de tener la configuración correcta

async function createUserPermissions(userId, permissions) {
    for (const permiso of permissions) {
        const perm = await Permiso.findOne({ where: { permiso } });
        if (perm) {
            await UsuarioPermiso.create({ usuario_id: userId, permiso_id: perm.id });
        }
    }
}


const handleCreateUsuario = async (data) => {
    
    try {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const usuario = await Usuario.create({ ...data, password: hashedPassword });
        if(usuario.rol==="administrador"){
            await createUserPermissions(usuario.id,permisos)
        }
        if(usuario.rol==="secretaria"){
            await createUserPermissions(usuario.id,permisosSecretaria)
        }
        
        return usuario;
    } catch (error) {
        
        throw error;
    }
};

const handleUpdateUsuario = async (id, data) => {
    
    try {
        const usuario = await Usuario.findByPk(id);
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }
        await usuario.update(data);
        
        return usuario;
    } catch (error) {
        
        throw error;
    }
};

const createUsuario = async (data) => {
    const usuario = await handleCreateUsuario(data);
    return usuario;
};

const getAllUsuarios = async () => {
    try {
        const usuarios = await Usuario.findAll({ include: { model: Permiso, as: 'permisos' },attributes:{exclude:["password"]} });
        return usuarios;
    } catch (error) {
        throw error;
    }
};

const getUsuarioById = async (id) => {
    try {
        let usuario = await Usuario.findByPk(id, { include: { model: Permiso, as: 'permisos' },attributes:{exclude:["password"]} });
        if(!usuario)
            return null;
        usuario = usuario.toJSON()
        if(usuario.rol === "profesional"){
            usuario.profesional = await Profesional.findOne({where:{usuario_id:id},attributes:["id","nombre","apellido"]});
            if (!usuario.profesional) {
                return null;
            }
        }
        if (!usuario) {
            return null;
        }
        return usuario;
    } catch (error) {
        throw error;
    }
};

const updateUsuario = async (id, data) => {
    if(data.password){
        const hashedPassword = await bcrypt.hash(data.password, 10);
        data.password = hashedPassword;
    }
    const usuario = await handleUpdateUsuario(id, data);
    return usuario;
};


const getUsuarioByUsername = async (username) => {
    return await Usuario.findOne({ where: { username }, include: [{ model: Profesional, as: 'profesional' },{ model: Permiso, as: 'permisos' }] });
};

const deleteUsuario = async (id) => {
    try {
        const usuario = await Usuario.findByPk(id);
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }
        await usuario.destroy();
        return { message: 'Usuario eliminado correctamente' };
    } catch (error) {
        throw error;
    }
};

const assignPermissions = async (userId, permissions) => {
    
    try {
        const usuario = await Usuario.findByPk(userId);
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }
        await UsuarioPermiso.destroy({ where: { usuario_id: userId } });
        for (const permiso of permissions) {
            const perm = await Permiso.findOne({ where: { permiso } });
            if (perm) {
                await UsuarioPermiso.create({ usuario_id: userId, permiso_id: perm.id });
            }
        }
        
    } catch (error) {
        
        throw error;
    }
};

const changePassword = async (userId, newPassword) => {
    
    try {
        const usuario = await Usuario.findByPk(userId);
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        usuario.password = hashedPassword;
        await usuario.save();
        
    } catch (error) {
        
        throw error;
    }
};

const login = async (username, password) => {
    let usuario = await Usuario.findOne({ where: { username }, include: { model: Permiso, as: 'permisos' } });
    if (!usuario) {
        throw new Error('Usuario no encontrado');
    }
    const isMatch = await bcrypt.compare(password, usuario.password);
    if (!isMatch) {
        throw new Error('Contraseña incorrecta');
    }
    usuario = usuario.toJSON()

    // Generar JWT para autenticación
    usuario.token = jwt.sign({ id: usuario.id, username: usuario.username }, JWT_SECRET, { expiresIn: '12h' });

    // Generar ws-token basado en permisos 
    if(usuario.rol==="profesional"){
        const profesional = await Profesional.findOne({ where: { usuario_id: usuario.id } ,include:['clinicas']});
        if (profesional) {
            usuario.wsToken = jwt.sign({ proyecto: 'turnero', codigos:[ `doctor-${profesional.id}`,"paciente"] }, WS_TOKEN_SECRET, { expiresIn: '12h' });
            usuario.profesional = {
                nombre:`${profesional.apellido}, ${profesional.nombre} ${profesional.clinicas && profesional.clinicas >0? "("+profesional.clinicas[0].nombre+")":''}`,
                id:profesional.id
            }
        }
    }else{
        usuario.wsToken = jwt.sign({ proyecto: 'turnero', codigos: ['actualizacion',"paciente"] }, WS_TOKEN_SECRET, { expiresIn: '12h' });
    }

    usuario.permisos = usuario.permisos.map(p=> p.permiso)

    return usuario;
};

module.exports = {
    createUsuario,
    getAllUsuarios,
    getUsuarioById,
    updateUsuario,
    deleteUsuario,
    assignPermissions,
    changePassword,
    login,
    getUsuarioByUsername
};
