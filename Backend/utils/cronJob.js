const cron = require('node-cron');
var cronTab = {};


async function createJob(schedule, callback, name) {
    let task;
    if (name) {
        if (cronTab[name]) {
            // cronTab[name].cancel();
        }
        task = cron.schedule(schedule, callback, { name: name, scheduled: true });
    } else task = cron.schedule(schedule, callback);

    cronTab[name] = task;
}

async function deleteJob(name) {
    if (cronTab[name]) {
        cronTab[name].cancel();
        delete cronTab[name];
    }
}

async function deleteAll() {
    if (Object.keys(cronTab).length > 0)
        Object.values(cronTab).forEach((task) => {
            task.cancel();
        });
}

module.exports = {
    createJob,
    deleteJob,
    deleteAll,
};
