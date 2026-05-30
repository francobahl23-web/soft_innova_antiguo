const CryptoJS = require('crypto-js');

const encrypt = (data) => {
    try {
        const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), "aX&y**v0O06H^5jJ").toString();
        return ciphertext;
    } catch (error) {
        console.log(error);
    }
}

const decrypt = (req, res, next) => {
    try {
        const bytes = CryptoJS.AES.decrypt(req.body.data, "aX&y**v0O06H^5jJ");
        const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        req.body = decryptedData
        return next()
    } catch (error) {
        console.log(error);
        return res.failureResponse({message: "Hay un error en su request."});
    }
}

module.exports = {
    encrypt,
    decrypt
};