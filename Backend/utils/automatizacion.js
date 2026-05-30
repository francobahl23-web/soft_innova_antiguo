const { createBloqueosForAllProfesionales } = require('../2-services/Profesional');
const { createJob } = require('./cronJob');

const iniciar = async () => {
    // Crear un trabajo de cron que se ejecuta anualmente
    await createJob('0 0 1 1 *', async () => {
        await createBloqueosForAllProfesionales();
    }, 'anual-bloqueos-job');
};

module.exports = { iniciar };
