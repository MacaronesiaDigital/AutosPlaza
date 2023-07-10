const { Card, Suggestion, Image } = require('dialogflow-fulfillment');
const dataHandler = require("./DataHandler.js");
const eennHandler = require("./EENNHandler.js");
const thripsJSON = require('../JSONs/Thrips.json');
const thripsData = []
var thripsSearchData = []

function checkData(){
    if(thripsData.length === 0){
        jsonData = dataHandler.fillData(thripsJSON.Thrips);
        jsonData.forEach(element => {
            thripsData.push(element);
        });
    }
}

function checkSearchData(){
    checkData();
    var myFilteredData = [];
    if(myFilteredData.length === 0){
        var filteredData = ""
        thripsSearchData.forEach(element => {
            filteredData = dataHandler.filterData(thripsData, "comun", ["comun", "cientifico", "danios", "hospedadoras", "caracteristicas", "comportamiento", "dania", "eenn", "enlace", "daniosObj", "caracteristicasObj"], element, "y");
            myFilteredData.push(filteredData[0])
        });
    };
    return myFilteredData;
}

async function infoThrips(agent) {
    checkData()
    var thripName = agent.context.get('info-thrips-followup').parameters['Thrips'];
    var myInfoData = "";
    var filteredData = "";

    filteredData = dataHandler.getObjectInformation(thripsData, "comun", ["comun", "cientifico", "danios", "hospedadoras", "caracteristicas", "comportamiento", "dania", "eenn", "enlace"], thripName);
    myInfoData = FormatArrayFull(filteredData);

    if (myInfoData.length == 0) {
        agent.add("No se ha encontrado nada que cumpla el filtro.");
    } else{
        finalString = "Esta es la información que tengo del ";
        if(Array.isArray(myInfoData)){
            myInfoData.forEach(element => {
                let cultivosString = element["dania"].join('\n    - ');
                let eennString = element["eenn"].join('\n    - ');
                
                finalString += element["comun"] + ": \nTambien conocido como: " + element["cientifico"] + "\nDaños: " + element["danios"] + "\nHospedadoras: " + element["hospedadoras"] + 
                "\nCaracterísticas: " + element["caracteristicas"] + "\nComportamiento: " + element["comportamiento"] + "\nDaña: \n    -" + cultivosString + "\nEnemigos naturales: \n    -" + eennString + "\nEnlace: " + element["enlace"];
            });
        } else{
            finalString += '\n- ' + myInfoData;
        }
    }

    agent.add(finalString);
}; 

async function filterThrips(agent) {
    checkData()
    var myFilteredData = "";
    var finalString = "";
    var counter = 0;

    var cultivoName = agent.context.get('info-sintomas-followup').parameters['Cultivos'];
    var eennName = agent.context.get('info-sintomas-followup').parameters['Enemigos_naturales'];
    var daniosName = agent.context.get('info-sintomas-followup').parameters['Danios'];
    var charactName = agent.context.get('info-sintomas-followup').parameters['Characteristic'];
    /*var andor = agent.context.get('filtro-thrips-followup').parameters['AndOr'];
    if (andor === undefined || !andor.toString()) {
        andor = "y"
    }*/

    var andor = ["y"]

    var CultivosFilter = false;
    var EENNFilter = false;
    var DaniosFilter = false;
    var CharacterFilter = false;
    if(cultivoName != undefined && cultivoName.length > 0) {
        CultivosFilter = true;
        counter++;
    }
    if(eennName != undefined && eennName.length > 0) {
        EENNFilter = true;
        counter++;
    }
    if(daniosName != undefined && daniosName.length > 0) {
        DaniosFilter = true;
        counter++;
    }
    if(charactName != undefined && charactName.length > 0) {
        CharacterFilter = true;
        counter++;
    }

    if(counter == 0){
        filteredData = dataHandler.allObjects(thripsData, ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"]);
        myFilteredData = FormatArray(filteredData);
    }
    else{
        let filteredData = dataHandler.allObjects(thripsData, ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"]);
        filteredData = FormatArray(filteredData);
        if(DaniosFilter){
            filteredData = dataHandler.filterData(filteredData, "daniosObj", ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"], daniosName, andor[0]);
            filteredData = FormatArray(filteredData);
        }
        if(CultivosFilter){
            filteredData = dataHandler.filterData(filteredData, "dania", ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"], cultivoName, andor[0]);
            filteredData = FormatArray(filteredData);
        }
        if(EENNFilter){
            filteredData = dataHandler.filterData(filteredData, "eenn", ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"], eennName, andor[0]);
            filteredData = FormatArray(filteredData);
        }
        
        myFilteredData = filteredData;
    }

    if (myFilteredData.length == 0) {
        agent.add("No tenemos datos sobre este tipo de problema, lo mejor será que te pongas en contacto con alguno de los los profesores de la plataforma: Estrella, Carina, etc.");
    } else{
        finalString = "Este tipo de manchas suele darse por una plaga de "
        for (let index = 0; index < myFilteredData.length; index++) {
            if(index == 0)
                finalString += myFilteredData[index]["comun"]
            else
                finalString += ", " + myFilteredData[index]["comun"]
        }
        finalString += ". Para combatir este thrip puedes recurrir a los siguientes enemigos naturales… Si quieres ver cómo puedes conseguirlos o atraerlos, escríbeme que quieres ver información sobre el enemigo natural. \n"
        myFilteredData.forEach(element => {
            let eennArray = GetEENN(element["comun"]);
            let eennString = eennArray.join('\n- ');
            finalString += eennString;
        });
    }

    agent.add(finalString)
    
};

async function filterThrips2(agent) {
    checkData()
    var myFilteredData = "";
    var finalString = "";
    var counter = 0;

    var cultivoName = agent.context.get('info-cultivos-followup').parameters['Cultivos'];
    var eennName = agent.context.get('info-cultivos-followup').parameters['Enemigos_naturales'];
    var daniosName = agent.context.get('info-cultivos-followup').parameters['Danios'];
    var charactName = agent.context.get('info-cultivos-followup').parameters['Characteristic'];
    /*var andor = agent.context.get('filtro-thrips-followup').parameters['AndOr'];
    if (andor === undefined || !andor.toString()) {
        andor = "y"
    }*/

    var andor = ["y"]

    var CultivosFilter = false;
    var EENNFilter = false;
    var DaniosFilter = false;
    var CharacterFilter = false;
    if(cultivoName != undefined && cultivoName.length > 0) {
        CultivosFilter = true;
        counter++;
    }
    if(eennName != undefined && eennName.length > 0) {
        EENNFilter = true;
        counter++;
    }
    if(daniosName != undefined && daniosName.length > 0) {
        DaniosFilter = true;
        counter++;
    }
    if(charactName != undefined && charactName.length > 0) {
        CharacterFilter = true;
        counter++;
    }

    if(counter == 0){
        filteredData = dataHandler.allObjects(thripsData, ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"]);
        myFilteredData = FormatArray(filteredData);
    }
    else{
        let filteredData = dataHandler.allObjects(thripsData, ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"]);
        filteredData = FormatArray(filteredData);
        if(DaniosFilter){
            filteredData = dataHandler.filterData(filteredData, "daniosObj", ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"], daniosName, andor[0]);
            filteredData = FormatArray(filteredData);
        }
        if(CultivosFilter){
            filteredData = dataHandler.filterData(filteredData, "dania", ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"], cultivoName, andor[0]);
            filteredData = FormatArray(filteredData);
        }
        if(EENNFilter){
            filteredData = dataHandler.filterData(filteredData, "eenn", ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"], eennName, andor[0]);
            filteredData = FormatArray(filteredData);
        }
        
        myFilteredData = filteredData;
    }

    if (myFilteredData.length == 0) {
        agent.add("No tenemos datos sobre este tipo de problema, lo mejor será que te pongas en contacto con alguno de los los profesores de la plataforma: Estrella, Carina, etc.");
    } else{
        finalString = "Estos son los thrips que pueden dañar tus cultivos de " + cultivoName + ": \n"
        for (let index = 0; index < myFilteredData.length; index++) {
            if(index == 0)
                finalString += "-" + myFilteredData[index]["comun"]
            else
                finalString += "\n-" + myFilteredData[index]["comun"]
        }
        finalString += "\n Puedes combatirlos con los siguientes eenn:"
        myFilteredData.forEach(element => {
            let eennArray = GetEENN(element["comun"]);
            let eennString = eennArray.join('\n- ');
            finalString += "\n" + element["comun"] + ":\n- " + eennString;
        });
    }

    agent.add(finalString)
    
};

async function filterThrips3(agent) {
    checkData()
    var myFilteredData = "";
    var finalString = "";
    var counter = 0;

    var cultivoName = agent.context.get('filtro-thrips-followup').parameters['Cultivos'];
    var eennName = agent.context.get('filtro-thrips-followup').parameters['Enemigos_naturales'];
    var daniosName = agent.context.get('filtro-thrips-followup').parameters['Danios'];
    var colorName = agent.context.get('filtro-thrips-followup').parameters['Color'];
    var patasNum = agent.context.get('filtro-thrips-followup').parameters['Patas'];
    var tamanioNum = agent.context.get('filtro-thrips-followup').parameters['Tamanio'];
    /*var andor = agent.context.get('filtro-thrips-followup').parameters['AndOr'];
    if (andor === undefined || !andor.toString()) {
        andor = "y"
    }*/

    var andor = ["y"]

    var CultivosFilter = false;
    var EENNFilter = false;
    var DaniosFilter = false;
    var ColorFilter = false;
    var PatasFilter = false;
    var TamanioFilter = false;
    if(cultivoName != undefined && cultivoName.length > 0) {
        CultivosFilter = true;
        counter++;
    }
    if(eennName != undefined && eennName.length > 0) {
        EENNFilter = true;
        counter++;
    }
    if(daniosName != undefined && daniosName.length > 0) {
        DaniosFilter = true;
        counter++;
    }
    if(colorName != undefined && colorName.length > 0) {
        ColorFilter = true;
        counter++;
    }
    if(patasNum != undefined && patasNum.length > 0) {
        PatasFilter = true;
        counter++;
    }
    if(tamanioNum != undefined && tamanioNum.length > 0) {
        TamanioFilter = true;
        counter++;
    }

    if(counter == 0){
        filteredData = dataHandler.allObjects(thripsData, ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"]);
        myFilteredData = FormatArray(filteredData);
    }
    else{
        let filteredData = dataHandler.allObjects(thripsData, ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"]);
        filteredData = FormatArray(filteredData);
        if(DaniosFilter){
            filteredData = dataHandler.filterData(filteredData, "daniosObj", ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"], daniosName, andor[0]);
            filteredData = FormatArray(filteredData);
        }
        if(CultivosFilter){
            filteredData = dataHandler.filterData(filteredData, "dania", ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"], cultivoName, andor[0]);
            filteredData = FormatArray(filteredData);
        }
        if(EENNFilter){
            filteredData = dataHandler.filterData(filteredData, "eenn", ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"], eennName, andor[0]);
            filteredData = FormatArray(filteredData);
        }
        if(ColorFilter){
            filteredData = dataHandler.filterData(filteredData, "caracteristicasObj", ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"], colorName, andor[0]);
            filteredData = FormatArray(filteredData);
        }
        if(PatasFilter){
            filteredData = dataHandler.filterData(filteredData, "caracteristicasObj", ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"], patasNum, andor[0]);
            filteredData = FormatArray(filteredData);
        }
        if(TamanioFilter){
            filteredData = dataHandler.filterData(filteredData, "caracteristicasObj", ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"], tamanioNum, andor[0]);
            filteredData = FormatArray(filteredData);
        }
        
        myFilteredData = filteredData;
    }

    if (myFilteredData.length == 0) {
        agent.add("No he encontrado ningún thrip.");
    } else{
        finalString = "Estos son los thrips que he encontrado: \n"
        for (let index = 0; index < myFilteredData.length; index++) {
            if(index == 0)
                finalString += "-" + myFilteredData[index]["comun"]
            else
                finalString += "\n-" + myFilteredData[index]["comun"]
        }
    }

    agent.add(finalString)
    
};

async function fightThrip(agent){
    checkData();
    var myFilteredData = "";
    var finalString = "";

    var thripName = agent.context.get('fight-thrip-intent-followup').parameters['Thrips'];
    var cultivoName = agent.context.get('fight-thrip-intent-followup').parameters['Cultivos'];

    var CultivosFilter = false;

    if(cultivoName.length > 0 && cultivoName != undefined) {
        CultivosFilter = true;
    }

    let filteredData = dataHandler.allObjects(thripsData, ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"]);
    filteredData = FormatArray(filteredData);
    filteredData = dataHandler.filterData(filteredData, "comun", ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"], thripName, "y");
    filteredData = FormatArray(filteredData);
    if(CultivosFilter){
        filteredData = dataHandler.filterData(filteredData, "dania", ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"], cultivoName, "y");
        filteredData = FormatArray(filteredData);
    }
    myFilteredData = filteredData;

    if (myFilteredData.length == 0) {
        agent.add("No se ha encontrado nada que cumpla el filtro.");
    } else{
        finalString = "Puedes combatir al " + thripName + " naturalmente recurriendo a los siguientes enemigos naturales: \n-";
        let allEenn = []
        myFilteredData.forEach(element => {
            element["eenn"].forEach(element1 => {
                allEenn.push(element1);
            });
        });
        let uniqueData = Array.from(new Set(allEenn));
        let eennString = uniqueData.join('\n- ');
        finalString += eennString;
        finalString += "\n Para ver qué setos puedes plantar para atraer estos enemigos naturales o ver más información sobre estos, indícame el nombre del enemigo natural que quieres ver."
    }
    agent.add(finalString);
}

async function identifyThrip(agent){
    checkData();
    var myFilteredData = "";
    var finalString = "";
    var counter = 0;

    var patasNum = agent.context.get('search-insects-followup').parameters['Patas'];
    var colorName = agent.context.get('search-insects-followup').parameters['Color'];

    var PatasFilter = false;
    var ColorFilter = false;

    if(patasNum.length > 0 && patasNum != undefined) {
        PatasFilter = true;
        counter++;
    }
    if(colorName.length > 0 && colorName != undefined) {
        ColorFilter = true;
        counter++;
    }

    if(counter == 0){
        filteredData = dataHandler.allObjects(thripsData, ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"]);
        myFilteredData = FormatArray(filteredData);
    }
    else{
        let filteredData = dataHandler.allObjects(thripsData, ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"]);
        filteredData = FormatArray(filteredData);
        if(PatasFilter){
            filteredData = dataHandler.filterData(filteredData, "caracteristicasObj", ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"], patasNum, "y");
            filteredData = FormatArray(filteredData);
        }
        if(ColorFilter){
            filteredData = dataHandler.filterData(filteredData, "caracteristicasObj", ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"], colorName, "y");
            filteredData = FormatArray(filteredData);
        }
        
        myFilteredData = filteredData;
    }

    if (myFilteredData.length == 0) {
        finalString = "Thrips:\nNo se ha encontrado nada que cumpla el filtro.";
    } else{
        finalString = "Estos son los thrips que corresponden con tus datos:";
        myFilteredData.forEach(element => {
            let thripString = "\n- " + element["comun"];
            finalString += thripString;
        });
        //finalString += "\n Para ver qué setos puedes plantar para atraer estos enemigos naturales o ver más información sobre estos, indícame el nombre del enemigo naturales que quieres ver."
    }

    finalString += "\n" + eennHandler.identifyEENN(patasNum, colorName);

    if(myFilteredData.length > 0 || eennHandler.getCurrentSearchSize() > 0)
        finalString += "\n ¿Me puedes decir cuánto mide?"

    thripsSearchData = myFilteredData;

    agent.add(finalString);
}

async function filterBySize(agent){
    if(thripsSearchData === undefined || thripsSearchData.length == 0){
        thripsSearchData = checkData();
    }
    var myFilteredData = "";
    var finalString = "";
    var counter = 0;

    var sizeNum = agent.context.get('search-insects-followup').parameters['Size'];
    var YesOrNo = agent.context.get('search-insects-followup').parameters['YesOrNo'];

    var SizeFilter = false;
    var YesOrNoFilter = false;

    if(sizeNum != undefined && sizeNum.length > 0) {
        SizeFilter = true;
        counter++;
    }
    if(YesOrNo != undefined && YesOrNo.length > 0) {
        YesOrNoFilter = true;
        counter++;
    }

    if(SizeFilter && !YesOrNoFilter){
        let filteredData = dataHandler.allObjects(thripsSearchData, ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"]);
        filteredData = FormatArray(filteredData);
    
        filteredData = dataHandler.filterData(filteredData, "caracteristicasObj", ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"], sizeNum, "y");
        filteredData = FormatArray(filteredData);

        myFilteredData = filteredData;

        if (myFilteredData.length == 0) {
            finalString = "Thrips:\nNo se ha encontrado nada que cumpla el filtro.";
        } else{
            myFilteredData = Array.from(new Set(myFilteredData));
            finalString = "Estos son los thrips que corresponden con tus datos:";
            myFilteredData.forEach(element => {
                let thripString = "\n- " + element["comun"];
                finalString += thripString;
            });
            //finalString += "\n Para ver qué setos puedes plantar para atraer estos enemigos naturales o ver más información sobre estos, indícame el nombre del enemigo naturales que quieres ver."
        }
        finalString += "\n" + eennHandler.filterBySize(sizeNum, YesOrNo);
    }
    else if(YesOrNoFilter){
        if(thripsSearchData === undefined){
            finalString = "Thrips:\nNo se ha encontrado nada que cumpla el filtro."
        }else{
            let filteredData = dataHandler.allObjects(thripsSearchData, ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"]);
            filteredData = FormatArray(filteredData);
            if(YesOrNo[0] === "No")
                filteredData = dataHandler.filterData(filteredData, "caracteristicasObj", ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"], [0.0, 2.9], "entre");
            else
                filteredData = dataHandler.filterData(filteredData, "caracteristicasObj", ["comun", "dania", "eenn", "daniosObj", "caracteristicasObj"], [3.0, 10.0], "entre");

            filteredData = FormatArray(filteredData);
            myFilteredData = filteredData;

            if (myFilteredData.length == 0) {
                finalString = "Thrips:\nNo se ha encontrado nada que cumpla el filtro.";
            } else{
                myFilteredData = Array.from(new Set(myFilteredData));
                finalString = "Estos son los thrips que corresponden con tus datos:";
                myFilteredData.forEach(element => {
                    let thripString = "\n- " + element["comun"];
                    finalString += thripString;
                });
                //finalString += "\n Para ver qué setos puedes plantar para atraer estos enemigos naturales o ver más información sobre estos, indícame el nombre del enemigo naturales que quieres ver."
            }
        }
        finalString += "\n" + eennHandler.filterBySize(sizeNum, YesOrNo);
    }
    else{
        finalString = "En ese caso, ¿Me puedes decir si es visible a simple vista?"
    }

    agent.add(finalString);
}

function GetEENN(thripName){
    checkData();
    var myFilteredData = "";
    var finalString = "";

    let filteredData = dataHandler.allObjects(thripsData, ["comun", "dania", "eenn"]);
    filteredData = FormatArray(filteredData);
    filteredData = dataHandler.filterData(filteredData, "comun", "eenn", thripName, "y");
    return filteredData[0];
}

function FormatArray(arrayToFormat){
    let structuredData = []
    for (let index = 0; index < arrayToFormat.length; index++) {
        let newItem;
        newItem = {"comun": arrayToFormat[index][0], "dania": arrayToFormat[index][1], "eenn": arrayToFormat[index][2], "daniosObj": arrayToFormat[index][3], "caracteristicasObj": arrayToFormat[index][4]};
        structuredData.push(newItem);
    }
    return structuredData;
}

function FormatArrayFull(arrayToFormat){
    let structuredData = []
    for (let index = 0; index < arrayToFormat.length; index++) {
        let newItem;
        newItem = {"comun": arrayToFormat[index][0], "cientifico": arrayToFormat[index][1], "danios": arrayToFormat[index][2], "hospedadoras": arrayToFormat[index][3], "caracteristicas": arrayToFormat[index][4], "comportamiento": arrayToFormat[index][5], "dania": arrayToFormat[index][6], "eenn": arrayToFormat[index][7], "enlace": arrayToFormat[index][8], "daniosObj": arrayToFormat[index][9], "caracteristicasObj": arrayToFormat[index][10]};
        structuredData.push(newItem);   
    }
    return structuredData;
}


module.exports = { infoThrips, filterThrips, filterThrips2, filterThrips3, filterBySize, fightThrip, identifyThrip };