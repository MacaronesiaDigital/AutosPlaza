const { Card, Suggestion, Image } = require('dialogflow-fulfillment');
const dataHandler = require("./DataHandler.js");
const setosJSON = require('../JSONs/Setos.json');
const setosData = []
var setosSearchData = []

function checkData(){
    if(setosData.length === 0){
        jsonData = dataHandler.fillData(setosJSON.Setos);
        jsonData.forEach(element => {
            setosData.push(element);
        });
    };
}

function checkSearchData(){
    checkData();
    var myFilteredData = [];
    if(myFilteredData.length === 0){
        var filteredData = ""
        setosSearchData.forEach(element => {
            filteredData = dataHandler.filterData(setosData, "comun", ["comun", "cientifico", "familia", "color", "ccolor", "altitud", "orientacion", "porte", "floracion", "eenn", "image"], element, "y");
            myFilteredData.push(filteredData[0])
        });
    };
    return myFilteredData;
}

function setSearchData(dataSearched){
    setosSearchData = dataSearched;
    //console.log(setosSearchData)
}

function binaryToMonth(arrayToConvert){
    let months = []
    for (let index = 0; index < 12; index++) {
        if(arrayToConvert[index] == 1)
            switch(index){
                case 0:
                    months.push("Enero");
                break;

                case 1:
                    months.push("Febrero");
                break;

                case 2:
                    months.push("Marzo");
                break;

                case 3:
                    months.push("Abril");
                break;

                case 4:
                    months.push("Mayo");
                break;

                case 5:
                    months.push("Junio");
                break;

                case 6:
                    months.push("Julio");
                break;

                case 7:
                    months.push("Agosto");
                break;

                case 8:
                    months.push("Septiembre");
                break;

                case 9:
                    months.push("Octubre");
                break;

                case 10:
                    months.push("Noviembre");
                break;

                case 11:
                    months.push("Diciembre");
                break;
            }
    }
    let monthsString
    for (let i = 0; i < months.length; i++) {
      if (i === months.length - 1) {
        monthsString += "y " + months[i];
      } else {
        monthsString += months[i] + ", ";
      }
    }
    
    monthsString = monthsString.replace(/undefined/g, '');
    return monthsString;
}

async function infoSetos(agent) {
    checkData()
    var setoName = agent.context.get('info-setos-followup').parameters['Setos'];
    var myFilteredData = "";

    myFilteredData = dataHandler.getObjectInformation(setosData, "comun", ["comun", "cientifico", "familia", "porte", "altitud", "floracion", "eenn","image"], setoName);

    if (myFilteredData !== undefined && myFilteredData.length == 0) {
        agent.add("No se ha encontrado nada que cumpla el filtro.");
    } else{
        agent.add("Esta es la información que tengo del " + setoName + ": \n");
        myFilteredData.forEach(element => {
            let response = ""
            if(element[6].length == 0)
                element[6][0] = "Ninguno."
            if(dataHandler.getCard()){
                response= new Card({
                    title: element[0],
                    imageUrl: 'https://5447-78-30-47-150.eu.ngrok.io' + element[7][0],
                    text: "También conocido como: " + element[1] + " perteneciente a la familia de " + element[2] + ". Suele crecer hasta los " + element[3] + " metros" +
                    ", a una altitud de entre " + element[4].join(' y ') + ". Su época de floración coincide con los meses de " + binaryToMonth(element[5]) + ". Atrae a los siguientes enemigos naturales: " +
                    element[6].join(', ')
                });
            } else{
                response = "Este es el " + element[0] + " también conocido como: " + element[1] + "perteneciente a la familia de " + element[2] + ". Suele crecer hasta los " + element[3] + " metros" +
                ", a una altitud de entre " + element[4].join(' y ') + ". Su época de floración coincide con los meses de " + binaryToMonth(element[5]) + ". Atrae a los siguientes enemigos naturales: " +
                element[6].join(', ');
            }
            agent.add(response);
        });
    }
};

async function filterSetos(agent) {
    checkData();
    var myFilteredData = "";
    var finalString = "";
    var counter = 0;

    var porteValue = agent.context.get('search-setos-followup').parameters['Porte'];
    var alturaValue = agent.context.get('search-setos-followup').parameters['Altura'];
    var florecimientoName = agent.context.get('search-setos-followup').parameters['Florecimiento'];
    var familiaName = agent.context.get('search-setos-followup').parameters['Familia'];
    var eennName = agent.context.get('search-setos-followup').parameters['Enemigos_naturales'];
    var colorName = agent.context.get('search-setos-followup').parameters['Color'];
    var andor = agent.context.get('search-setos-followup').parameters['AndOr'];
    if(andor.length == 0){
        andor = "o"
    } 

    if (!porteValue.toString() || !alturaValue.toString()) {
        if(alturaValue.length == 1){
            alturaValue = [0, alturaValue[0]];
        }
        if(porteValue.length == 1){
            porteValue = [0, porteValue[0]];
        }
    }

    if(familiaName.length > 0){
        if(familiaName[0] === "familia" || familiaName[0] === "familias"){
            familiaName = familiaName.slice(1); 
        }
        let resultArray = familiaName.map(word => {
            return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        });
        familiaName = resultArray;
    }

    if(eennName.length > 0){
        let resultArray = eennName.map(word => {
            return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        });
        eennName = resultArray;
    }

    if(colorName.length > 0){
        let resultArray = colorName.map(word => {
            return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        });
        colorName = resultArray;
    }

    //console.log(familiaName)

    var PorteFilter = false;
    var AlturaFilter = false;
    var FlorecimientoFilter = false;
    var FamiliaFilter = false;
    var EENNFilter = false;
    var ColorFilter = false;
    if(porteValue.length > 0 && porteValue != undefined) {
        PorteFilter = true;
        counter++;
    }
    if(alturaValue.length > 0 && alturaValue != undefined) {
        AlturaFilter = true;
        counter++;
    }
    if(florecimientoName.length > 0 && florecimientoName != undefined) {
        FlorecimientoFilter = true;
        counter++;
    }
    if(familiaName.length > 0 && familiaName != undefined) {
        FamiliaFilter = true;
        counter++;
    }
    if(eennName.length > 0 && eennName != undefined) {
        EENNFilter = true;
        counter++;
    }
    if(colorName.length > 0 && colorName != undefined) {
        ColorFilter = true;
        counter++;
    }

    if(counter == 0){
        filteredData = dataHandler.allObjects(setosData, ["comun", "porte", "altitud", "floracion", "familia", "eenn", "color"]);
        myFilteredData = FormatArray(filteredData);
    }
    else{
        let filteredData = dataHandler.allObjects(setosData, ["comun", "porte", "altitud", "floracion", "familia", "eenn", "color"]);
        filteredData = FormatArray(filteredData);
        if(PorteFilter){
            filteredData = dataHandler.filterData(filteredData, "porte", ["comun", "porte", "altitud", "floracion", "familia", "eenn", "color"], porteValue, "entre");
            filteredData = FormatArray(filteredData);
        } 
        if(AlturaFilter){
            filteredData = dataHandler.filterData(filteredData, "altitud", ["comun", "porte", "altitud", "floracion", "familia", "eenn", "color"], alturaValue, "entre");
            filteredData = FormatArray(filteredData);
        } 
        if(FlorecimientoFilter){
            filteredData = dataHandler.filterData(filteredData, "floracion", ["comun", "porte", "altitud", "floracion", "familia", "eenn", "color"], florecimientoName, andor[0]);
            filteredData = FormatArray(filteredData);
        } 
        if(FamiliaFilter){
            filteredData = dataHandler.filterData(filteredData, "familia", ["comun", "porte", "altitud", "floracion", "familia", "eenn", "color"], familiaName, andor[0]);
            filteredData = FormatArray(filteredData);
        } 
        if(EENNFilter){
            filteredData = dataHandler.filterData(filteredData, "eenn", ["comun", "porte", "altitud", "floracion", "familia", "eenn", "color"], eennName, andor[0]);
            filteredData = FormatArray(filteredData);
        }
        if(ColorFilter){
            filteredData = dataHandler.filterData(filteredData, "color", ["comun", "porte", "altitud", "floracion", "familia", "eenn", "color"], colorName, andor[0]);
            filteredData = FormatArray(filteredData);
        }
        myFilteredData = filteredData;
    }
    
    if (myFilteredData.length == 0) {
        agent.add("No se ha encontrado nada que cumpla el filtro.");
    } else{
        finalString = "Estos son los setos que he encontrado:";
        myFilteredData.forEach(element => {
            finalString += " \n-" + element["comun"];
        });
    }

    agent.add(finalString)
};

async function filterSetos2(agent) {
    checkData();
    var myFilteredData = "";
    var finalString = "";
    var counter = 0;

    var porteValue = agent.context.get('filtro-setos-followup').parameters['Porte'];
    var alturaValue = agent.context.get('filtro-setos-followup').parameters['Altura'];
    var florecimientoName = agent.context.get('filtro-setos-followup').parameters['Florecimiento'];
    var familiaName = agent.context.get('filtro-setos-followup').parameters['Familia'];
    var eennName = agent.context.get('filtro-setos-followup').parameters['Enemigos_naturales'];
    var colorName = agent.context.get('filtro-setos-followup').parameters['Color'];
    var andor = agent.context.get('filtro-setos-followup').parameters['AndOr'];
    if(andor.length == 0){
        andor = "o"
    } 

    if (!porteValue.toString() || !alturaValue.toString()) {
        let newValues = []
        porteValue.forEach(element => {
            if(element != "porte"){
                newValues.push(element)
            }
        });
        porteValue = newValues;
        if(alturaValue.length == 1){
            alturaValue = [0, alturaValue[0]];
        }
        if(porteValue.length == 1){
            porteValue = [0, porteValue[0]];
        }
    }

    if(familiaName.length > 0){
        if(familiaName[0] === "familia" || familiaName[0] === "familias"){
            familiaName = familiaName.slice(1); 
        }
        let resultArray = familiaName.map(word => {
            return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        });
        familiaName = resultArray;
    }

    if(eennName.length > 0){
        let resultArray = eennName.map(word => {
            return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        });
        eennName = resultArray;
    }

    if(colorName.length > 0){
        let resultArray = colorName.map(word => {
            return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        });
        colorName = resultArray;
    }

    //console.log(familiaName)

    var PorteFilter = false;
    var AlturaFilter = false;
    var FlorecimientoFilter = false;
    var FamiliaFilter = false;
    var EENNFilter = false;
    var ColorFilter = false;
    if(porteValue.length > 0 && porteValue != undefined) {
        PorteFilter = true;
        counter++;
    }
    if(alturaValue.length > 0 && alturaValue != undefined) {
        AlturaFilter = true;
        counter++;
    }
    if(florecimientoName.length > 0 && florecimientoName != undefined) {
        FlorecimientoFilter = true;
        counter++;
    }
    if(familiaName.length > 0 && familiaName != undefined) {
        FamiliaFilter = true;
        counter++;
    }
    if(eennName.length > 0 && eennName != undefined) {
        EENNFilter = true;
        counter++;
    }
    if(colorName.length > 0 && colorName != undefined) {
        ColorFilter = true;
        counter++;
    }

    if(counter == 0){
        filteredData = dataHandler.allObjects(setosData, ["comun", "porte", "altitud", "floracion", "familia", "eenn", "color"]);
        myFilteredData = FormatArray(filteredData);
    }
    else{
        let filteredData = dataHandler.allObjects(setosData, ["comun", "porte", "altitud", "floracion", "familia", "eenn", "color"]);
        filteredData = FormatArray(filteredData);
        if(PorteFilter){
            filteredData = dataHandler.filterData(filteredData, "porte", ["comun", "porte", "altitud", "floracion", "familia", "eenn", "color"], porteValue, "entre");
            filteredData = FormatArray(filteredData);
        } 
        if(AlturaFilter){
            filteredData = dataHandler.filterData(filteredData, "altitud", ["comun", "porte", "altitud", "floracion", "familia", "eenn", "color"], alturaValue, "entre");
            filteredData = FormatArray(filteredData);
        } 
        if(FlorecimientoFilter){
            filteredData = dataHandler.filterData(filteredData, "floracion", ["comun", "porte", "altitud", "floracion", "familia", "eenn", "color"], florecimientoName, andor[0]);
            filteredData = FormatArray(filteredData);
        } 
        if(FamiliaFilter){
            filteredData = dataHandler.filterData(filteredData, "familia", ["comun", "porte", "altitud", "floracion", "familia", "eenn", "color"], familiaName, andor[0]);
            filteredData = FormatArray(filteredData);
        } 
        if(EENNFilter){
            filteredData = dataHandler.filterData(filteredData, "eenn", ["comun", "porte", "altitud", "floracion", "familia", "eenn", "color"], eennName, andor[0]);
            filteredData = FormatArray(filteredData);
        }
        if(ColorFilter){
            filteredData = dataHandler.filterData(filteredData, "color", ["comun", "porte", "altitud", "floracion", "familia", "eenn", "color"], colorName, andor[0]);
            filteredData = FormatArray(filteredData);
        }
        myFilteredData = filteredData;
    }
    
    if (myFilteredData.length == 0) {
        agent.add("No se ha encontrado nada que cumpla el filtro.");
    } else{
        finalString = "Estos son los setos que he encontrado:";
        myFilteredData.forEach(element => {
            finalString += " \n-" + element["comun"];
        });
    }

    agent.add(finalString)
};

async function filterSearchedSetos(agent) {
    var myFilteredData = "";
    var finalString = "";
    var counter = 0;

    var porteValue = agent.context.get('search-setos-followup').parameters['Porte'];
    var alturaValue = agent.context.get('search-setos-followup').parameters['Altura'];
    var florecimientoName = agent.context.get('search-setos-followup').parameters['Florecimiento'];
    var familiaName = agent.context.get('search-setos-followup').parameters['Familia'];
    var eennName = agent.context.get('search-setos-followup').parameters['Enemigos_naturales'];
    var colorName = agent.context.get('search-setos-followup').parameters['Color'];
    var andor = agent.context.get('search-setos-followup').parameters['AndOr'];
    if(andor.length == 0){
        andor = "o"
    } 

    if (!porteValue.toString() || !alturaValue.toString()) {
        if(alturaValue.length == 1){
            alturaValue = [0, alturaValue[0]];
        }
        if(porteValue.length == 1){
            porteValue = [0, porteValue[0]];
        }
    }

    if(familiaName.length > 0){
        if(familiaName[0] === "familia" || familiaName[0] === "familias"){
            familiaName = familiaName.slice(1); 
        }
        let resultArray = familiaName.map(word => {
            return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        });
        familiaName = resultArray;
    }

    if(eennName.length > 0){
        let resultArray = eennName.map(word => {
            return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        });
        eennName = resultArray;
    }

    if(colorName.length > 0){
        let resultArray = colorName.map(word => {
            return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        });
        colorName = resultArray;
    }//console.log(familiaName)

    var PorteFilter = false;
    var AlturaFilter = false;
    var FlorecimientoFilter = false;
    var FamiliaFilter = false;
    var EENNFilter = false;
    var ColorFilter = false;
    if(porteValue.length > 0 && porteValue != undefined) {
        PorteFilter = true;
        counter++;
    }
    if(alturaValue.length > 0 && alturaValue != undefined) {
        AlturaFilter = true;
        counter++;
    }
    if(florecimientoName.length > 0 && florecimientoName != undefined) {
        FlorecimientoFilter = true;
        counter++;
    }
    if(familiaName.length > 0 && familiaName != undefined) {
        FamiliaFilter = true;
        counter++;
    }
    if(eennName.length > 0 && eennName != undefined) {
        EENNFilter = true;
        counter++;
    }
    if(colorName.length > 0 && colorName != undefined) {
        ColorFilter = true;
        counter++;
    }

    if(counter == 0){
        filteredData = FormatArrayFull(checkSearchData());
        myFilteredData = filteredData;
    }
    else{
        //let filteredData = dataHandler.allObjects(setosData, ["comun", "porte", "altitud", "floracion", "familia", "eenn"]);
        //filteredData = FormatArray(filteredData);
        filteredData = FormatArrayFull(checkSearchData());
        if(PorteFilter){
            filteredData = dataHandler.filterData(filteredData, "porte", ["comun", "porte", "altitud", "floracion", "familia", "eenn", "color"], porteValue, "entre");
            filteredData = FormatArray(filteredData);
        } 
        if(AlturaFilter){
            filteredData = dataHandler.filterData(filteredData, "altitud", ["comun", "porte", "altitud", "floracion", "familia", "eenn", "color"], alturaValue, "entre");
            filteredData = FormatArray(filteredData);
        } 
        if(FlorecimientoFilter){
            filteredData = dataHandler.filterData(filteredData, "floracion", ["comun", "porte", "altitud", "floracion", "familia", "eenn", "color"], florecimientoName, andor[0]);
            filteredData = FormatArray(filteredData);
        } 
        if(FamiliaFilter){
            filteredData = dataHandler.filterData(filteredData, "familia", ["comun", "porte", "altitud", "floracion", "familia", "eenn", "color"], familiaName, andor[0]);
            filteredData = FormatArray(filteredData);
        } 
        if(EENNFilter){
            filteredData = dataHandler.filterData(filteredData, "eenn", ["comun", "porte", "altitud", "floracion", "familia", "eenn", "color"], eennName, andor[0]);
            filteredData = FormatArray(filteredData);
        }
        if(ColorFilter){
            filteredData = dataHandler.filterData(filteredData, "color", ["comun", "porte", "altitud", "floracion", "familia", "eenn", "color"], colorName, andor[0]);
            filteredData = FormatArray(filteredData);
        }
        myFilteredData = filteredData;
    }
    
    if (myFilteredData.length == 0) {
        agent.add("No se ha encontrado nada que cumpla el filtro.");
    } else{
        finalString = "Estos son los setos que he encontrado:";
        myFilteredData.forEach(element => {
            finalString += " \n-" + element["comun"];
        });
    }

    agent.add(finalString)
};

function FormatArray(arrayToFormat){
    let structuredData = []
    for (let index = 0; index < arrayToFormat.length; index++) {
        let newItem;
        newItem = {"comun": arrayToFormat[index][0], "porte": arrayToFormat[index][1], "altitud": arrayToFormat[index][2], "floracion": arrayToFormat[index][3], "familia": arrayToFormat[index][4], "eenn": arrayToFormat[index][5], "color": arrayToFormat[index][6]};
        structuredData.push(newItem);   
    }
    return structuredData;
}

function FormatArrayFull(arrayToFormat){
    let structuredData = []
    for (let index = 0; index < arrayToFormat.length; index++) {
        let newItem;
        newItem = {"comun": arrayToFormat[index][0], "cientifico": arrayToFormat[index][1], "familia": arrayToFormat[index][2], "color": arrayToFormat[index][3], "ccolor": arrayToFormat[index][4], "altitud": arrayToFormat[index][5], "orientacion": arrayToFormat[index][6], "porte": arrayToFormat[index][7], "floracion": arrayToFormat[index][8], "eenn": arrayToFormat[index][9], "image": arrayToFormat[index][10],};
        structuredData.push(newItem);   
    }
    return structuredData;
}

module.exports = { infoSetos, filterSetos, filterSetos2, filterSearchedSetos, setSearchData };