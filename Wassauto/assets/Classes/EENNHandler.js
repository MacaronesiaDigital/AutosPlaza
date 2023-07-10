const dataHandler = require("./DataHandler.js");
const thripsHandler = require("./ThripsHandler") ;
const setosHandler = require("./SetosHandler") ;
const eennJSON = require('../JSONs/EENN.json');
const eennData = []
var eennSearchData = []

function checkData(){
    if(eennData.length === 0){
        jsonData = dataHandler.fillData(eennJSON.EENN);
        jsonData.forEach(element => {
            eennData.push(element);
        });
    }
}

function checkSearchData(){
    checkData();
    var myFilteredData = [];
    if(myFilteredData.length === 0){
        var filteredData = ""
        eennSearchData.forEach(element => {
            filteredData = dataHandler.filterData(eennData, "name", ["name", "setos", "thrips", "caracteristicasObj"], element, "y");
            myFilteredData.push(filteredData[0])
        });
    };
    return myFilteredData;
}

async function infoEENN(agent) {
    checkData()
    var eennName = agent.context.get('fight-thrip-intent-followup').parameters['EENN'];
    
    //console.log(eennName);
    
    var myInfoData = "";
    var filteredData = "";

    filteredData = dataHandler.getObjectInformation(eennData, "name", ["name", "setos", "thrips", "caracteristicasObj"], eennName);
    myInfoData = FormatArray(filteredData);

    if (!myInfoData.toString()) {
        finalString = "No se ha encontrado nada que cumpla el filtro."
    } else{
        finalString = "Esta es la información que tengo del ";
        if(Array.isArray(myInfoData)){
            myInfoData.forEach(element => {
                let setosString = element["setos"].join('\n    - ');
                let thripsString = element["thrips"].join('\n    - ');
                
                finalString += element["name"] + ": \nSetos que habita: \n    -" + setosString + "\nThrips que ataca: \n    -" + thripsString;
            });
        } else{
            finalString += '\n- ' + myInfoData;
        }
    }

    agent.add(finalString);
};

async function infoEENN2(agent) {
    checkData()
    eennName = agent.context.get('info-eenn-followup').parameters['Enemigos_naturales'];
    
    //console.log(eennName);
    
    var myInfoData = "";
    var filteredData = "";

    filteredData = dataHandler.getObjectInformation(eennData, "name", ["name", "setos", "thrips", "caracteristicasObj"], eennName);
    myInfoData = FormatArray(filteredData);

    if (!myInfoData.toString()) {
        finalString = "No se ha encontrado nada que cumpla el filtro."
    } else{
        finalString = "Esta es la información que tengo del ";
        if(Array.isArray(myInfoData)){
            myInfoData.forEach(element => {
                let setosString = element["setos"].join('\n    - ');
                let thripsString = element["thrips"].join('\n    - ');
                
                finalString += element["name"] + ": \nSetos que habita: \n    -" + setosString + "\nThrips que ataca: \n    -" + thripsString;
            });
        } else{
            finalString += '\n- ' + myInfoData;
        }
    }

    agent.add(finalString);
};

async function filterEENN(agent) {
    checkData()
    var myFilteredData = "";
    var finalString = "";
    var counter = 0;

    var setoName = agent.context.get('filtro-eenn-followup').parameters['Setos'];
    var thripName = agent.context.get('filtro-eenn-followup').parameters['Thrips'];
    var andor = agent.context.get('filtro-eenn-followup').parameters['AndOr'];
    if(andor.length == 0){
        andor = "o"
    }

    var SetoFilter = false;
    var ThripFilter = false;
    if(setoName.length > 0 && setoName != undefined) {
        SetoFilter = true;
        counter++;
    }
    if(thripName.length > 0 && thripName != undefined) {
        ThripFilter = true;
        counter++;
    }

    if(counter == 0){
        filteredData = dataHandler.allObjects(eennData, ["name", "setos", "thrips", "caracteristicasObj"]);
        myFilteredData = FormatArray(filteredData);
    } 
    else{
        let filteredData = dataHandler.allObjects(eennData, ["name", "setos", "thrips", "caracteristicasObj"]);
        filteredData = FormatArray(filteredData);
        if(SetoFilter){
            filteredData = dataHandler.filterData(filteredData, "setos", ["name", "setos", "thrips", "caracteristicasObj"], setoName, andor[0]);
            filteredData = FormatArray(filteredData);
        } 
        if(ThripFilter){
            filteredData = dataHandler.filterData(filteredData, "thrips", ["name", "setos", "thrips", "caracteristicasObj"], thripName, andor[0]);
            filteredData = FormatArray(filteredData);
        }
        myFilteredData = filteredData;
    }

    if (myFilteredData.length == 0) {
        agent.add("No se ha encontrado nada que cumpla el filtro.");
    } else{
        myFilteredData = Array.from(new Set(myFilteredData));
        finalString = "Estos son los enemigos naturales que he encontrado:";
        myFilteredData.forEach(element => {
            finalString += " \n-" + element["name"];
        });
    }

    agent.add(finalString)
};

async function getSetos(agent) {
    checkData()
    var myInfoData = "";
    var filteredData = "";
    var setos = "";

    var thripName = agent.context.get('search-setos-followup').parameters['Thrips'];

    eennSetos = dataHandler.filterData(eennData, "thrips", "setos", thripName, "y");
    //console.log(eennSetos)

    allSetos = []
    eennSetos.forEach(element => {
        element.forEach(element1 => {
            allSetos.push(element1)
        });
    });

    const uniqueSetos = Array.from(new Set(allSetos));

    uniqueSetos.sort((a, b) => a.localeCompare(b));

    let setosString = "";
    for (let i = 0; i < uniqueSetos.length; i++) {
        if (i === uniqueSetos.length - 1) {
            setosString += "\n- " + uniqueSetos[i] + " \n";
        } else {
            setosString += "\n- " + uniqueSetos[i];
        }
    }

    if (uniqueSetos.length == 0) {
        setosString = "No se ha encontrado nada que cumpla el filtro.";
    } else{
        setosString = "Estos son los setos que puedes plantar para combatir el thrip de ficus: " + setosString + "Puedes ver información sobre cómo combaten al thrip de Ficus estos setos o cómo puedes conseguir el seto. Solo indicame que quieres ver información del seto que deseas.";
    }

    setosHandler.setSearchData(uniqueSetos);

    agent.add(setosString);
}

function identifyEENN(patasNum, colorName){
    checkData();
    var myFilteredData = "";
    var finalString = "";
    var counter = 0;

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
        filteredData = dataHandler.allObjects(eennData, ["name", "setos", "thrips", "caracteristicasObj"]);
        myFilteredData = FormatArray(filteredData);
    }
    else{
        let filteredData = dataHandler.allObjects(eennData, ["name", "setos", "thrips", "caracteristicasObj"]);
        filteredData = FormatArray(filteredData);
        if(PatasFilter){
            filteredData = dataHandler.filterData(filteredData, "caracteristicasObj", ["name", "setos", "thrips", "caracteristicasObj"], patasNum, "y");
            filteredData = FormatArray(filteredData);
        }
        if(ColorFilter){
            filteredData = dataHandler.filterData(filteredData, "caracteristicasObj", ["name", "setos", "thrips", "caracteristicasObj"], colorName, "y");
            filteredData = FormatArray(filteredData);
        }
        
        myFilteredData = filteredData;
    }

    if (myFilteredData.length == 0) {
        finalString = "Enemigos naturales:\nNo se ha encontrado ninguno que cumpla el filtro."
    } else{
        myFilteredData = Array.from(new Set(myFilteredData));
        finalString = "Estos son los enemigos naturales que corresponden con tus datos:";
        myFilteredData.forEach(element => {
            let eennString = "\n- " + element["name"];
            finalString += eennString;
        });
        //finalString += "\n Para ver qué setos puedes plantar para atraer estos enemigos naturales o ver más información sobre estos, indícame el nombre del enemigo naturales que quieres ver."
    }

    eennSearchData = myFilteredData;

    return finalString;
}

function filterBySize(sizeNum, YesOrNo){
    if(eennSearchData === undefined || eennSearchData.length == 0){
        eennSearchData = checkData();
    }
    var myFilteredData = "";
    var finalString = "";
    var counter = 0;

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
        let filteredData = dataHandler.allObjects(eennSearchData, ["name", "setos", "thrips", "caracteristicasObj"]);
        filteredData = FormatArray(filteredData);
    
        filteredData = dataHandler.filterData(filteredData, "caracteristicasObj", ["name", "setos", "thrips", "caracteristicasObj"], sizeNum, "y");
        filteredData = FormatArray(filteredData);

        myFilteredData = filteredData;

        if (myFilteredData.length == 0) {
            finalString = "Enemigos naturales:\nNo se ha encontrado nada que cumpla el filtro.";
        } else{
            myFilteredData = Array.from(new Set(myFilteredData));
            finalString = "Estos son los enemigos que corresponden con tus datos:";
            myFilteredData.forEach(element => {
                let eennString = "\n- " + element["name"];
                finalString += eennString;
            });
            //finalString += "\n Para ver qué setos puedes plantar para atraer estos enemigos naturales o ver más información sobre estos, indícame el nombre del enemigo naturales que quieres ver."
        }
    }
    else if(YesOrNoFilter){
        if(eennSearchData === undefined){
            finalString = "Enemigos naturales:\nNo se ha encontrado nada que cumpla el filtro.";
        }else{
            let filteredData = dataHandler.allObjects(eennSearchData, ["name", "setos", "thrips", "caracteristicasObj"]);
            filteredData = FormatArray(filteredData);
            if(YesOrNo[0] === "No")
                filteredData = dataHandler.filterData(filteredData, "caracteristicasObj", ["name", "setos", "thrips", "caracteristicasObj"], [0.0, 2.9], "entre");
            else
                filteredData = dataHandler.filterData(filteredData, "caracteristicasObj", ["name", "setos", "thrips", "caracteristicasObj"], [3.0, 10.0], "entre");
            
            filteredData = FormatArray(filteredData);
            myFilteredData = filteredData;

            if (myFilteredData.length == 0) {
                finalString = "Enemigos naturales:\nNo se ha encontrado nada que cumpla el filtro.";
            } else{
                myFilteredData = Array.from(new Set(myFilteredData));
                finalString = "Estos son los enemigos que corresponden con tus datos:";
                myFilteredData.forEach(element => {
                    let eennString = "\n- " + element["name"];
                    finalString += eennString;
                });
                //finalString += "\n Para ver qué setos puedes plantar para atraer estos enemigos naturales o ver más información sobre estos, indícame el nombre del enemigo naturales que quieres ver."
            }
        }
    }

    return finalString;
}

function getCurrentSearchSize(){
    return eennSearchData.length
}

function GetSetos(agent) {
    checkData()
    var myInfoData = "";
    var filteredData = "";

    var thripName = agent.context.get('search-setos-followup').parameters['Thrips'];

    eennSetos = dataHandler.filterData(eennData, "thrips", "setos", thripName, "y");
    //console.log(eennSetos)

    allSetos = []
    eennSetos.forEach(element => {
        element.forEach(element1 => {
            allSetos.push(element1)
        });
    });

    const uniqueSetos = Array.from(new Set(allSetos));

    uniqueSetos.sort((a, b) => a.localeCompare(b));

    return uniqueSetos;
}

function FormatArray(arrayToFormat){
    let structuredData = []
    for (let index = 0; index < arrayToFormat.length; index++) {
        let newItem;
        newItem = {"name": arrayToFormat[index][0], "setos": arrayToFormat[index][1], "thrips": arrayToFormat[index][2], "caracteristicasObj": arrayToFormat[index][3]};
        structuredData.push(newItem);   
    }
    return structuredData;
}

module.exports = { infoEENN, infoEENN2, filterEENN, getSetos, identifyEENN, filterBySize, getCurrentSearchSize, GetSetos};