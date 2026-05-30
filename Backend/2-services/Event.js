// app/2-services/Event.js

const axios = require('axios');
const https = require('https');

const publishEvent = async (codigo, data) => {
    try { 
        const body = { codigo, data, proyecto: "turnero"};
        const agent = new https.Agent({  
            rejectUnauthorized: false
        });

        const response = await axios.post(
            process.env.EVENT_URL ? process.env.EVENT_URL + '/api/publish' : 'https://event-server:9000/api/publish', 
            body, 
            { httpsAgent: agent }
        );

        if (!response.data.success) {
            throw new Error('Error al publicar evento');
        }

        return response;
    } catch (error) {
        console.error('Error al publicar evento:', error.message);
    }
};


module.exports = {publishEvent};
