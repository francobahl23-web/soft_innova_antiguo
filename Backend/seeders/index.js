const xlsx = require('xlsx');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../app/models');
const profesionalRepository = require('../app/3-repositories/Profesional');
const {permisos,permisosSecretaria}= require('../app/constants/authConstant');
const ProfesionalDTO = require('../app/2-services/DTO/ProfesionalDTO');
const { Paciente, PacienteContacto, PacienteCobertura, Usuario, Contacto, Cobertura, Permiso, UsuarioPermiso } = db;

const excelPath = path.join(__dirname, 'Innova-agenda.xlsx');
const workbook = xlsx.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

async function findOrCreateUser(email) {
    let user = await Usuario.findOne({ where: { mail: email } });
    if (!user) {
        const hashedPassword = await bcrypt.hash(email, 10); 
        user = await Usuario.create({
            username: email,
            password: hashedPassword,
            mail: email,
            rol: 'secretaria',
            nombre: email.split('@')[0],
        });
    }
    await createUserPermissions(user.id, permisosSecretaria);
    return user;
}

function splitContacts(contactStr) {
    contactStr = contactStr ? contactStr.toString() : '';
    return contactStr ? contactStr.split(',').map(contact => contact.trim()) : [];
}

async function createUserPermissions(userId, permissions) {
    for (const permiso of permissions) {
        const perm = await Permiso.findOne({ where: { permiso } });
        if (perm) {
            await UsuarioPermiso.create({ usuario_id: userId, permiso_id: perm.id });
        }
    }
}

async function updateOrCreatePatient(data) {
    let { DNI, firstName, lastName, dob, country, gender, phones, emails, nombreCobertura, createdAt, createdBy } = data;
    if (DNI && typeof DNI === 'string' && DNI.includes(' Fecha Nacimiento: ')) {
        let arr = DNI.split(" Fecha Nacimiento: ");
        DNI = arr[0];
        dob = arr[1];
    }
    //const user = await findOrCreateUser(createdBy);

    let paciente = DNI ? await Paciente.findOne({ where: { dni: String(DNI) } }) : null;

    if (paciente) {
        paciente.nombre = firstName || paciente.nombre;
        paciente.apellido = lastName || paciente.apellido;
        paciente.fecha_nacimiento = null;
        paciente.pais = country || paciente.pais;
        paciente.genero = gender || paciente.genero;
        paciente.createdAt = new Date(createdAt) || paciente.createdAt;
        paciente.createdBy = 1;

        await paciente.save();
        await PacienteContacto.destroy({ where: { paciente_id: paciente.id } });
        await PacienteCobertura.destroy({ where: { paciente_id: paciente.id } });
    } else {
        paciente = await Paciente.create({
            dni: DNI ? String(DNI) : null,
            nombre: firstName ?? 'Sin Info DR APP',
            apellido: lastName ?? 'Sin Info DR APP',
            fecha_nacimiento: null,
            pais: country,
            genero: gender,
            createdAt: new Date(createdAt),
            createdBy: 1,
        });
    }

    const contactos = [];
    const phoneContacts = splitContacts(phones);
    const emailContacts = splitContacts(emails);

    for (const phone of phoneContacts) {
        const contacto = await Contacto.create({ tipo: 'telefono', valor: phone });
        contactos.push(contacto);
    }

    for (const email of emailContacts) {
        const contacto = await Contacto.create({ tipo: 'email', valor: email });
        contactos.push(contacto);
    }

    for (const contacto of contactos) {
        await PacienteContacto.create({ paciente_id: paciente.id, contacto_id: contacto.id });
    }

    if (nombreCobertura) {
        let cobertura = await Cobertura.findOne({ where: { nombre: nombreCobertura } });
        if (!cobertura) {
            cobertura = await Cobertura.create({ nombre: nombreCobertura });
        }
        await PacienteCobertura.create({ paciente_id: paciente.id, cobertura_id: cobertura.id });
    }
}

async function seedPatients() {
    for (const row of sheet) {
        let { DNI, firstName, lastName, 'date of born': dob, country, gender, phones, emails, Cobertura: nombreCobertura, createdAt, createdBy } = row;
        if (gender === null) gender = 'O';
        else if (gender === 'female') gender = 'F';
        else if (gender === 'male') gender = 'M';
        else gender = null;

        await updateOrCreatePatient({ DNI, firstName, lastName, dob, country, gender, phones, emails, nombreCobertura, createdAt, createdBy });
    }
}
async function seedPermissions() {

    for (const permiso of permisos) {
        await Permiso.create({ permiso });
    }
}

async function seedUsersAndPermissions() {
    const usersData = [
        { username: 'admin', password: 'admin123', rol: 'administrador', nombre: 'Admin', telefono: '123456789', mail: 'admin@example.com', permisos},
        { username: 'secretaria', password: 'secretaria123', rol: 'secretaria', nombre: 'Secretaria', telefono: '123456789', mail: 'secretaria@example.com', 
            permisos: permisosSecretaria},
    ];

    for (const userData of usersData) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        console.log(userData.password)
        console.log(hashedPassword)
        const user = await Usuario.create({ ...userData, password: hashedPassword });
        await createUserPermissions(user.id, userData.permisos);
    }
}
async function seedDotor(){
    let profesional = {"nombre":"Admin","apellido":"Adminito","dni":"1234567","fecha_nacimiento":"2024-07-19T03:00:00.000Z","genero":"Otro","practicas":[{"nombre":"dentista","duracion_moda":"00:30:00"}],"obrasSociales":["galeno"],"coberturas":[],"clinicas":["INNOVA"],"horarios":{"L":[{"start":"09:00","end":"18:00"}],"X":[{"start":"09:00","end":"12:00"},{"start":"16:00","end":"20:00"}]},"telefonos":["02664881578"],"emails":["demiguelnicolas14@gmail.com"],"contactos":[{"tipo":"telefono","valor":"02664881578"},{"tipo":"email","valor":"demiguelnicolas14@gmail.com"}]}
    
    await profesionalRepository.createProfesional(ProfesionalDTO.toDatabase(profesional))
    console.log("doctor seeded")
}
async function execSeed() {
    try{
        /*await seedPatients();
        console.log('Datos seeded 🍺');
        return
        await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
        await db.sequelize.sync({ force: true });
        await seedPermissions();
        await seedUsersAndPermissions();
        await seedDotor();
        console.log('Datos seeded 🍺');
        */
    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
    }
}

module.exports = {
  execSeed
};
