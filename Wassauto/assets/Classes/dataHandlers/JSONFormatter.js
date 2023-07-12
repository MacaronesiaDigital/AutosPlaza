const fs = require('fs');
const XLSX = require('xlsx');

function vehicleJSON(unformattedJSON, filePath){
    var licenseArray = [];
    var jsonString = "[\n";
    var ii = 0;
    unformattedJSON.forEach(element => {
        if(ii > unformattedJSON.length - 3)
            return;

        var license = ''

        if(element['   Actuales (Vivos)   Listado de Vehículo. Simple.   Ordenado por: Marc-Mod']){
            license = element['   Actuales (Vivos)   Listado de Vehículo. Simple.   Ordenado por: Marc-Mod'].toString();
        } else{
            return;
        }
        
        var obj = new Object();
        /*obj.group = element[Object.keys(element)[1]];
        obj.license  = element[Object.keys(element)[3]];
        obj.model = element[Object.keys(element)[4]];
        obj.color = element[Object.keys(element)[9]];*/
        if(license != ''){
            obj.license  = license;
            licenseArray.push(license);
        } else{
            obj.license = "";
        }
        
        if(element['Fecha :']){
            obj.group = element['Fecha :'];
        } else{
            obj.group = "";
        }

        if(element['__EMPTY']){
            obj.model = element['__EMPTY'];
         }else{
            obj.model = "";
        }

        if(element['__EMPTY_5']){
            obj.color = element['__EMPTY_5'];
        } else{
            obj.color = "";
        }

        jsonString += JSON.stringify(obj);
        jsonString += ",\n";
        /*if(ii < unformattedJSON.length - 3){
            jsonString += ",\n"
        }*/
        ii++;
    });
    licensesString = JSON.stringify(licenseArray);
    jsonString += '{\"usedLicenses\":' + licensesString + "}\n]";
    fs.writeFileSync(filePath, jsonString);
}

function bookingJSON(unformattedJSON, filePath){
    var codBookArray = [];
    var jsonString = "[\n";
    var ii = 0;
    var obj = new Object();
    unformattedJSON.forEach(element => {
        if(ii > unformattedJSON.length - 3)
            return;

        var codBook = ''

        if(ii%2 == 0){

            if(element['Fecha :']){
                codBook = element['Fecha :'].toString();
            } else{
                return;
            }
            
            obj = new Object();

            if(codBook != ''){
                obj.codBook  = codBook;
                codBookArray.push(codBook);
            } else{
                obj.codBook = "";
            }

            if(element[Object.keys(element)[2]]){
                obj.codClient = element['Fecha :'];
            } else{
                obj.codClient = "";
            }

            if(element['__EMPTY_7']){
                obj.license = element['__EMPTY_7'];
            } else{
                obj.license = "";
            }

            if(element['__EMPTY']){
                const dateObject = XLSX.SSF.parse_date_code(element['__EMPTY']);
                const jsDate = new Date(Date.UTC(dateObject.y, dateObject.m - 1, dateObject.d));
                var timeString = '00:00';
                if(element['__EMPTY_1']){
                    timeString = element['__EMPTY_1'];
                } 
                obj.deliveryDate = formatDate(dateObject, timeString);
            } else{
                obj.deliveryDate = "";
            }

            if(element['__EMPTY_2']){
                const dateObject = XLSX.SSF.parse_date_code(element['__EMPTY_2']);
                const jsDate = new Date(Date.UTC(dateObject.y, dateObject.m - 1, dateObject.d));
                var timeString = '00:00';
                if(element['__EMPTY_3']){
                    timeString = element['__EMPTY_3'];
                } 
                obj.returnDate = formatDate(dateObject, timeString);
            } else{
                obj.returnDate = "";
            }

            if(element['__EMPTY_5']){
                obj.returnLocation = element['__EMPTY_5'];
            } else{
                obj.returnLocation = "";
            }

        } else{

            if(element['__EMPTY']){
                obj.deliveryLocation = element['__EMPTY'];
            } else{
                obj.deliveryLocation = "";
            }

            jsonString += JSON.stringify(obj);
            jsonString += ",\n";

        }

        ii++;
    });
    codBookArray = JSON.stringify(codBookArray);
    jsonString += '{\"usedBookings\":' + codBookArray + "}\n]";
    fs.writeFileSync(filePath, jsonString);
}

function userJSON(unformattedJSON){
    var codClientArray = [];
    var jsonString = "[\n";
    var ii = 0;
    unformattedJSON.forEach(element => {
        if(ii > unformattedJSON.length - 3)
            return;

        var codClient = ''

        if(element['   Actuales (Vivos)   Listado de Vehículo. Simple.   Ordenado por: Marc-Mod']){
            codClient = element['   Actuales (Vivos)   Listado de Vehículo. Simple.   Ordenado por: Marc-Mod'].toString();
        } else{
            return;
        }
        
        var obj = new Object();
        /*obj.group = element[Object.keys(element)[1]];
        obj.license  = element[Object.keys(element)[3]];
        obj.model = element[Object.keys(element)[4]];
        obj.color = element[Object.keys(element)[9]];*/
        if(codClient != ''){
            obj.codClient = codClient;
            licenseArray.push(codClient);
        } else{
            obj.codClient = "";
        }
        
        if(element['Fecha :']){
            obj.group = element['Fecha :'];
        } else{
            obj.group = "";
        }

        if(element['__EMPTY']){
            obj.model = element['__EMPTY'];
         }else{
            obj.model = "";
        }

        if(element['__EMPTY_5']){
            obj.color = element['__EMPTY_5'];
        } else{
            obj.color = "";
        }

        jsonString += JSON.stringify(obj);
        jsonString += ",\n";
        /*if(ii < unformattedJSON.length - 3){
            jsonString += ",\n"
        }*/
        ii++;
    });
    codClientString = JSON.stringify(codClientArray);
    jsonString += '{\"usedClients\":' + codClientString + "}\n]";
    fs.writeFileSync('./Wassauto/JSON/JSONTest.json', jsonString);
}

function formatDate(dateObject, timeString){
    const [hours, minutes] = timeString.split(':'); // Splitting the time string into hours and minutes

    dateObject.H = parseInt(hours); // Setting the hours of the dateObject
    dateObject.M = parseInt(minutes); // Setting the minutes of the dateObject

    // Constructing the final JavaScript Date object
    const jsDate = new Date(Date.UTC(dateObject.y, dateObject.m - 1, dateObject.d, dateObject.H, dateObject.M));

    // Formatting the date as "YYYY-MM-DD HH:mm"
    const formattedDate = jsDate.toISOString().slice(0, 16).replace('T', ' ');

    return formattedDate;
}

module.exports = {
    vehicleJSON, bookingJSON, userJSON,
};