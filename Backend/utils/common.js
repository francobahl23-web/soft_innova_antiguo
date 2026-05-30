 
 

/**
 * Genera un arreglo sin duplicados, si prop es null compara por el mismo elemento
 * si prop es un array se toma como que cada elemento posee el atributo en el array compara por todos iguales
 * Si prop es un string compara por esa propiedad
 * @param arr
 * @param prop
 * @returns {Promise<*>}
 */
const numeroALetras = require('./numeroALetras')
function precioALetras(precio) {
    return numeroALetras(precio, {
        plural: "PESOS",
        singular: "PESO",
        centPlural: "CENTAVOS",
        centSingular: "CENTAVO"
    });
}
function createSet(arr, prop) {
    return arr.reduce((ac, obj) => {
        if (prop === null)
            return ac.includes(obj) ? ac : [...ac, obj];
        let flag = true;
        if (typeof prop == 'array') {
            ac.findIndex(ad => {
                for (let i = 0; i < prop.length; i++) {
                    if (ad[prop[i]] !== obj[prop[i]])
                        flag = false;
                }
            })
        }
        if (typeof prop == 'string') {
            flag = ac.findIndex(ad => obj[prop] === ad[prop]) === -1
        }
        if (flag)
            ac.push(obj)
        return ac
    }, [])
}
const XLSX = require('xlsx');
async function getPrecioArs(valor){
    let response = await fetch("https://dolarapi.com/v1/dolares/oficial")
        .then(response => response.json())
        .catch(err => {
            return null;
        });
    if(!response)
        return 0;
    return Math.round((valor * response.venta )* 100) / 100;
}
async function getValorDolar(){
    let response = await fetch("https://dolarapi.com/v1/dolares/oficial")
        .then(response => response.json())
        .catch(err => {
            return null;
        });
    if(!response)
        return 0;
    return response.venta;
}
async function getPrecioDolar(valor){
    let response = fetch("https://dolarapi.com/v1/dolares/oficial")
        .then(response => response.json())
        .catch(err => {
            return null;
        });
    if(!response)
        return 0;
    return Math.round(( valor / response.venta)* 100) / 100;

}
function strToDate(dtStr) {
    if (!dtStr) return null
    let dateParts = dtStr.split("/");
    let timeParts = dateParts[2].split(" ")[1].split(":");

    let ano = dateParts[2].split(" ")[0];
    if (ano.length === 2)
        ano = "20" + ano

    let dateObject = new Date(ano, dateParts[1] - 1, +dateParts[0], timeParts[0], timeParts[1], timeParts[2]);
    return dateObject.setTime(dateObject.getTime());
}

const readExcel = (dir, opts = {}) => {
    //Leemos el excel
    let workbook = XLSX.readFile(dir, opts)
    let sheet_name_list = workbook.SheetNames
    let xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]], {header: 1})

    return xlData
}

const readExcelByPage = (dir, page) => {
    //Leemos el excel
    let workbook = XLSX.readFile(dir)
    let sheet_name_list = workbook.SheetNames
    let xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[page]], {header: 1})

    return xlData
}

function checkDNI(dni) {
    return dni.length < 7 || dni.length > 9 || isNaN(dni);
}

function uniq(a) {
    return a.sort().filter(function (item, pos, ary) {
        return !pos || item != ary[pos - 1];
    });
}

/*
 * convertObjectToEnum : convert object to enum
 * @param obj          : {}
 */

function firstLetterToUpper(string) {
    let arr = string.split(' ');
    let map = arr.map(palabra => {
        return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
    });
    return map.join(' ');
}

const convertObjectToEnum = (obj) => {
    const enumArr = [];
    Object.values(obj).map((val) => enumArr.push(val));
    return enumArr;
};

/*
 * randomNumber : generate random numbers.
 * @param length          : number *default 4
 */
const randomNumber = (length = 4) => {
    const numbers = '12345678901234567890';
    let result = '';
    for (let i = length; i > 0; i -= 1) {
        result += numbers[Math.round(Math.random() * (numbers.length - 1))];
    }
    return result;
};

/*
 * replaceAll: find and replace al; occurrence of a string in a searched string
 * @param string : string to be replace
 * @param search : string which you want to replace
 * @param replace: string with which you want to replace a string
 */
const replaceAll = (string, search, replace) => string.split(search).join(replace);

/*
 * uniqueValidation: validate Login With Fields while Registration
 * @param Model : Mongoose Model, on which query runs
 * @param data : data , coming from request
 */
const uniqueValidation = async (Model, data) => {
    let filter = {$or: []};
    if (data && data['username']) {
        filter['$or'].push(
            {'username': data['username']},
            {'email': data['username']},
        );
    }
    if (data && data['email']) {
        filter['$or'].push(
            {'username': data['email']},
            {'email': data['email']},
        );
    }
    let found = await dbService.getDocumentByQuery(Model, filter);
    return !found;

};

const getDifferenceOfTwoDatesInTime = (currentDate, toDate) => {
    let hours = toDate.diff(currentDate, 'hour');
    currentDate = currentDate.add(hours, 'hour');
    let minutes = toDate.diff(currentDate, 'minute');
    currentDate = currentDate.add(minutes, 'minute');
    let seconds = toDate.diff(currentDate, 'second');
    currentDate.add(seconds, 'second');
    if (hours) {
        return `${hours} hour, ${minutes} minute and ${seconds} second`;
    }
    return `${minutes} minute and ${seconds} second`;
};

function dateCheck(from, to, check) {

    let fDate, lDate, cDate;
    fDate = Date.parse(from);
    lDate = Date.parse(to);
    cDate = Date.parse(check);
    return (cDate <= lDate && cDate >= fDate);

}

function generateRandomIntegerInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
    convertObjectToEnum, uniq, generateRandomIntegerInRange,
    randomNumber, dateCheck,
    precioALetras,getValorDolar,
    replaceAll, checkDNI,
    uniqueValidation,
    getDifferenceOfTwoDatesInTime,
    readExcel,
    readExcelByPage, createSet,
};
