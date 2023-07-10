/*==============================================================================
||Esta función comprueba de donde llega la petición y cambia el valor de      ||
||'useCard' si es compatible con el uso de Cards.                             ||
==============================================================================*/
let useCard;
function checkCard(currentPlatform){
    if(currentPlatform == "telegram")
        useCard = true;
    else
        useCard = false;
}

function getCard(){
    return useCard;
}


/*==============================================================================
||Esta función devuelve un array con todos los elementos del json pasado por  ||
||parametro, el cuál es almacenado en la clase que llama a esta función       ||
==============================================================================*/
function fillData(json){
    Data = []
    for(var i in json)
        Data.push(json[i]);

    return Data;
}

/*==============================================================================
||Esta función toma un array, la variable que quieres recibir como resultado  ||
||y devuelve un array de esa variable de todos los elementos sin duplicados.  ||
==============================================================================*/
function allObjects(dataToFilter, varToOutput){
    var myFilteredData =[];
    
    for (var ii = 0, l = dataToFilter.length; ii < l; ii++){
        if(Array.isArray(varToOutput)){
            var elementData = [];
            varToOutput.forEach(element => {
                elementData.push(dataToFilter[ii][element])
                myFilteredData.push(elementData)
            });
        } else{
            myFilteredData.push(dataToFilter[ii][varToOutput])
        }
    }

    let uniqueData = Array.from(new Set(myFilteredData));

    return uniqueData;
}

/*==============================================================================
||Esta función toma un array que serán los datos que se filtraran, la variable||
||que quieres filtrar, la variable que quieres recibir como resultado, el     ||
||valor con el que filtrar y el tipo de filtrado que quieres hacer.           ||
||Devuelve un array con el valor pedido de cada elemento filtrado             ||
==============================================================================*/
function filterData(dataToFilter, varToFilter, varToOutput, valueToFilter, andor) {
    var myFilteredData =[];
    /*==============================================================================
    ||Primero un for para pasar por cada objeto en dataToFilter, luego un if para ||
    ||actuar en función de el número de parámetros para el filtro.                ||
    ==============================================================================*/
    //console.log(dataToFilter)
    for (var ii = 0, l = dataToFilter.length; ii < l; ii++){
        console.log(valueToFilter.length)
        if(valueToFilter.length > 1){
            var counter = 0;
            let minValue = Math.min(...valueToFilter);
            let maxValue = Math.max(...valueToFilter);
            if(andor === "y" || andor === "o"){
			    for (var jj = 0, ll = valueToFilter.length; jj < ll; jj++){
                    //console.log(varToFilter)
                    if(varToFilter === "daniosObj"){
                        if(dataToFilter[ii][varToFilter].hoja != undefined){
                            /*console.log(dataToFilter[ii][varToFilter].hoja)
                            console.log(valueToFilter[jj])*/
                            if(dataToFilter[ii][varToFilter].hoja.indexOf(valueToFilter[jj]) !== -1){ 
                                counter++;
                            }
                        }
                        if(dataToFilter[ii][varToFilter].flores != undefined){
                            /*console.log(dataToFilter[ii][varToFilter].flores)
                            console.log(valueToFilter[jj])*/
                            if(dataToFilter[ii][varToFilter].flores.indexOf(valueToFilter[jj]) !== -1){ 
                                counter++;
                            }
                        }
                        if(dataToFilter[ii][varToFilter].fruto != undefined){
                            /*console.log(dataToFilter[ii][varToFilter].fruto)
                            console.log(valueToFilter[jj])*/
                            if(dataToFilter[ii][varToFilter].fruto.indexOf(valueToFilter[jj]) !== -1){ 
                                counter++;
                            }
                        }
                    }
                    
                    if(varToFilter === "caracteristicasObj"){
                        if(dataToFilter[ii][varToFilter].hoja != undefined){
                            console.log(dataToFilter[ii][varToFilter].tamanio)
                            console.log(valueToFilter[jj])
                            if(dataToFilter[ii][varToFilter].tamanio === valueToFilter[jj]){ 
                                counter++;
                            }
                        }
                        if(dataToFilter[ii][varToFilter].flores != undefined){
                            /*console.log(dataToFilter[ii][varToFilter].color)
                            console.log(valueToFilter[jj])*/
                            if(dataToFilter[ii][varToFilter].color === valueToFilter[jj]){ 
                                counter++;
                            }
                        }
                        if(dataToFilter[ii][varToFilter].fruto != undefined){
                            /*console.log(dataToFilter[ii][varToFilter].patas)
                            console.log(valueToFilter[jj])*/
                            if(dataToFilter[ii][varToFilter].patas === valueToFilter[jj]){ 
                                counter++;
                            }
                        }
                    } 
                    else{
                        if(dataToFilter[ii][varToFilter].indexOf(valueToFilter[jj]) !== -1){ 
                            counter++;
                        }
                    }
			    }
            }

            switch(andor){
                case "y":
                    if(counter === valueToFilter.length)
                        if(Array.isArray(varToOutput)){
                            var elementData = [];
                            varToOutput.forEach(element => {
                                elementData.push(dataToFilter[ii][element])
                                myFilteredData.push(elementData)
                            });
                        } else{
                            myFilteredData.push(dataToFilter[ii][varToOutput])
                        }
                        
                break;

                case "o":
                    if(counter > 0)
                        if(Array.isArray(varToOutput)){
                            var elementData = [];
                            varToOutput.forEach(element => {
                                elementData.push(dataToFilter[ii][element])
                                myFilteredData.push(elementData)
                            });
                            //console.log(myFilteredData)
                        } else{
                            myFilteredData.push(dataToFilter[ii][varToOutput])
                        }
                break;

                case "entre":
                    let checkBetween = false;
                    //console.log(dataToFilter[ii])
                    if(Array.isArray(dataToFilter[ii][varToFilter]) && dataToFilter[ii][varToFilter].length > 1){
                        checkBetween = dataToFilter[ii][varToFilter].some(val => val >= minValue && val <= maxValue);
                    } else{
                        if(varToFilter === "caracteristicasObj"){
                            if(dataToFilter[ii][varToFilter].tamanio >= minValue && dataToFilter[ii][varToFilter].tamanio <= maxValue)
                                checkBetween = true;
                        } else{
                            if(dataToFilter[ii][varToFilter] >= minValue && dataToFilter[ii][varToFilter] <= maxValue)
                                checkBetween = true;
                        }
                        
                    }
                    if(checkBetween)
                        if(Array.isArray(varToOutput)){
                            var elementData = [];
                            varToOutput.forEach(element => {
                                elementData.push(dataToFilter[ii][element])
                                myFilteredData.push(elementData)
                            });
                            //console.log(myFilteredData)
                        } else{
                            myFilteredData.push(dataToFilter[ii][varToOutput])
                        }
                break;
            }
        } else{
            if(dataToFilter[ii][varToFilter].length > 1){
                if(dataToFilter[ii][varToFilter].indexOf(valueToFilter[0]) !== -1){ 
                    if(Array.isArray(varToOutput)){
                        var elementData = [];
                        varToOutput.forEach(element => {
                            elementData.push(dataToFilter[ii][element])
                            myFilteredData.push(elementData)
                        });
                    } else{
                        myFilteredData.push(dataToFilter[ii][varToOutput])
                    }
                }
            } 
            if(varToFilter === "daniosObj"){
                if(dataToFilter[ii][varToFilter].hoja != undefined){
                    /*console.log("hoja:" + dataToFilter[ii][varToFilter].hoja)
                    console.log(valueToFilter[0])*/
                    if(dataToFilter[ii][varToFilter].hoja.indexOf(valueToFilter[0]) !== -1){ 
                        if(Array.isArray(varToOutput)){
                            var elementData = [];
                            varToOutput.forEach(element => {
                                elementData.push(dataToFilter[ii][element])
                                myFilteredData.push(elementData)
                            });
                        } else{
                            myFilteredData.push(dataToFilter[ii][varToOutput])
                        }
                    }
                }
                if(dataToFilter[ii][varToFilter].flores != undefined){
                    /*console.log("flores:" + dataToFilter[ii][varToFilter].flores)
                    console.log(valueToFilter[0])*/
                    if(dataToFilter[ii][varToFilter].flores.indexOf(valueToFilter[0]) !== -1){ 
                        if(Array.isArray(varToOutput)){
                            var elementData = [];
                            varToOutput.forEach(element => {
                                elementData.push(dataToFilter[ii][element])
                                myFilteredData.push(elementData)
                            });
                        } else{
                            myFilteredData.push(dataToFilter[ii][varToOutput])
                        }
                    }
                }
                if(dataToFilter[ii][varToFilter].fruto != undefined){
                    /*console.log("fruto:" + dataToFilter[ii][varToFilter].fruto)
                    console.log(valueToFilter[0])*/
                    if(dataToFilter[ii][varToFilter].fruto.indexOf(valueToFilter[0]) !== -1){ 
                        if(Array.isArray(varToOutput)){
                            var elementData = [];
                            varToOutput.forEach(element => {
                                elementData.push(dataToFilter[ii][element])
                                myFilteredData.push(elementData)
                            });
                        } else{
                            myFilteredData.push(dataToFilter[ii][varToOutput])
                        }
                    }
                }
            }
            if(varToFilter === "caracteristicasObj"){
                if(dataToFilter[ii][varToFilter].tamanio != undefined){
                    console.log("tamanio:" + dataToFilter[ii][varToFilter].tamanio)
                    console.log(valueToFilter[0])
                    if(dataToFilter[ii][varToFilter].tamanio == valueToFilter){ 
                        if(Array.isArray(varToOutput)){
                            var elementData = [];
                            varToOutput.forEach(element => {
                                elementData.push(dataToFilter[ii][element])
                                myFilteredData.push(elementData)
                            });
                        } else{
                            myFilteredData.push(dataToFilter[ii][varToOutput])
                        }
                    }
                }
                if(dataToFilter[ii][varToFilter].color != undefined){
                    /*console.log("color:" + dataToFilter[ii][varToFilter].color)
                    console.log(valueToFilter[0])*/
                    if(dataToFilter[ii][varToFilter].color == valueToFilter){
                        if(Array.isArray(varToOutput)){
                            var elementData = [];
                            varToOutput.forEach(element => {
                                elementData.push(dataToFilter[ii][element])
                                myFilteredData.push(elementData)
                            });
                        } else{
                            myFilteredData.push(dataToFilter[ii][varToOutput])
                        }
                    }
                }
                if(dataToFilter[ii][varToFilter].patas != undefined){
                    /*console.log("patas:" + dataToFilter[ii][varToFilter].patas)
                    console.log(valueToFilter[0])*/
                    if(dataToFilter[ii][varToFilter].patas == valueToFilter){ 
                        if(Array.isArray(varToOutput)){
                            var elementData = [];
                            varToOutput.forEach(element => {
                                elementData.push(dataToFilter[ii][element])
                                myFilteredData.push(elementData)
                            });
                        } else{
                            myFilteredData.push(dataToFilter[ii][varToOutput])
                        }
                    }
                }
            }
            else{
                if(dataToFilter[ii][varToFilter] == valueToFilter[0]){
                    if(Array.isArray(varToOutput)){
                        var elementData = [];
                        varToOutput.forEach(element => {
                            elementData.push(dataToFilter[ii][element])
                            myFilteredData.push(elementData)
                        });
                    } else{
                        myFilteredData.push(dataToFilter[ii][varToOutput])
                    }
                }
            }
        }
    }

    let uniqueData = Array.from(new Set(myFilteredData));

    return uniqueData;
}

/*==============================================================================
||Esta función toma un array que serán los datos que se filtraran, la variable||
||que quieres filtrar, la variable que quieres recibir como resultado y el    ||
||valor con el que filtrar.                                                   ||
||//TODO// Devuelve la información del objeto filtrado.                       ||
==============================================================================*/
function getObjectInformation(dataToFilter, varToFilter, varToOutput, varFilter) {
    let object = dataToFilter.filter(t => t[varToFilter] && t[varToFilter].toLowerCase() === varFilter.toLowerCase());
    let myFilteredData = []
    if(object.length > 0) {
        if(Array.isArray(varToOutput)){
            var elementData = [];
            varToOutput.forEach(element => {
                elementData.push(object[0][element])
                myFilteredData.push(elementData)
            });
        } else{
            myFilteredData.push(object[0][varToOutput])
        }
        let uniqueData = Array.from(new Set(myFilteredData));
        return uniqueData;
    } else {
        return "No se ha encontrado ningún " + varFilter;
    }
}

module.exports = { fillData, allObjects, filterData, getObjectInformation, checkCard, getCard };