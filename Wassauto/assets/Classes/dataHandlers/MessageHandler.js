const config = require('../../../config');

const schedule = require('node-schedule');

const twilio = require('../connections/twilio');
const dialogflow = require('../connections/dialogflow');

const MongoHandler = require('../connections/MongoBDConnection') ;
const { query } = require('express');

const ngrokUrl = config.NGROKURL;

var testCounter = 0;

async function languageSelector(phoneNumber){
    payload = await dialogflow.sendToDialogFlow("langChose", phoneNumber);
}

async function firstMessage(phoneNumber, language){

    if(testCounter > 0){
        return;
    }

    const query = { phones: phoneNumber };
    var user = await MongoHandler.executeQueryFirst(query, 'Users');

    //GetLangFromExt(user._id, phoneNumber);

    var query2 = { intent: "firstMessage" }
    var responses = await MongoHandler.executeQueryFirst(query2, "Responses");

    var message = responses["text"+language];

    console.log(message);
    
    sendAnswer(phoneNumber, message);

    console.log("test")

    const inputDate = new Date();
    const date = getDate(inputDate, 'm', 'sum', 1);

    //scheduleConfirmationMessage(user._id, date, phoneNumber);

    bookingCode = user.lastBooking.toString();
    const query3 = { codBook: bookingCode };
    var booking = await MongoHandler.executeQueryFirst(query3, 'Bookings');

    var inputDate2 = stringToDate(booking.returnDate);
    const date2 = getDate(inputDate2, 'd', 'subs', 1);

    console.log(inputDate + " - " + inputDate2);

    //scheduleReturnMessage(user._id, date2, phoneNumber);

    const date3 = getDate(inputDate2, 'm', 'sum', 30);

    //scheduleRatingMessage(user._id, date3, phoneNumber);
    
    //await sleep(30000);

    //askConfirmationMessage();
}

async function confirmationMessage(phoneNumber){

    const query = { phones: phoneNumber };
    var user = await MongoHandler.executeQueryFirst(query, 'Users');
    bookingCode = user.lastBooking.toString();
    const query2 = { codBook: bookingCode };
    var booking = await MongoHandler.executeQueryFirst(query2, 'Bookings');

    var date = stringToDate(booking.deliveryDate);
    const formattedDate = formatDateToDayMonthYearHourMinute(date);

    var message = "";

    switch(user.language){

        case "es":
            message = "ℹ️ Le damos la bienvenida a Tenerife, aquí tiene la información detallada de su coche alquilado:\n\n" +
            "Fecha y hora de recogida: " + formattedDate.toString() + "\n"+ 
            "Lugar de recogida: " + booking.returnLocation + "\n"+ 
            "Accesorios: " + booking.accesories + "\n" +
            "Parking: " + booking.parking + "\n";

            if(booking.notes != "None"){
                message += "Nota: " + booking.notes + "\n";
            }

            message += "Ubicación: ";

        break;

        case "de":
            message = "ℹ️ Le damos la bienvenida a Tenerife, aquí tiene la información detallada de su coche alquilado:\n\n" +
            "Fecha y hora de recogida: " + formattedDate.toString() + "\n"+ 
            "Lugar de recogida: " + booking.returnLocation + "\n"+ 
            "Accesorios: " + booking.accesories + "\n" +
            "Parking: " + booking.parking + "\n";

            if(booking.notes != "None"){
                message += "Nota: " + booking.notes + "\n";
            }

            message += "Ubicación: ";

        break;

        default:
            message = "ℹ️ Le damos la bienvenida a Tenerife, aquí tiene la información detallada de su coche alquilado:\n\n" +
            "Fecha y hora de recogida: " + formattedDate.toString() + "\n"+ 
            "Lugar de recogida: " + booking.returnLocation + "\n"+ 
            "Accesorios: " + booking.accesories + "\n" +
            "Parking: " + booking.parking + "\n";

            if(booking.notes != "None"){
                message += "Nota: " + booking.notes + "\n";
            }

        break;

    }
    
    sendAnswer(phoneNumber, message);

    await sleep(1000);
    
    twilio.sendLocationMessage(phoneNumber, booking.returnCoords[0], booking.returnCoords[1]);

    await sleep(2000);

    GetReturnCar(phoneNumber, booking.license);

    const inputDate2 = stringToDate(booking.deliveryDate);
    const date2 = getDate(inputDate2, 's', 'sum', 10);

    scheduleConfirmationMessage(user._id, date2, phoneNumber);

    var inputDate3 = stringToDate(booking.returnDate);
    const date3 = getDate(inputDate3, 'd', 'subs', 1);

    console.log(inputDate2 + " - " + inputDate3);

    scheduleReturnMessage(user._id, date3, phoneNumber);

    const date4 = getDate(inputDate3, 'm', 'sum', 30);

    scheduleRatingMessage(user._id, date4, phoneNumber);

    //console.log(message);
}

async function askConfirmationMessage(phoneNumber){
    const query = { phones: phoneNumber };
    var user = await MongoHandler.executeQueryFirst(query, 'Users');

    var query2 = { intent: "askConfirmation" }
    var responses = await MongoHandler.executeQueryFirst(query2, "Responses");

    var message = responses["text"+user.language];

    payload = await dialogflow.sendToDialogFlow("confirmBooking", phoneNumber);
    sendAnswer(phoneNumber, message);
}

async function returnMessage(phoneNumber){

    const query = { phones: phoneNumber };
    var user = await MongoHandler.executeQueryFirst(query, 'Users');
    bookingCode = user.lastBooking.toString();
    const query2 = { codBook: bookingCode };
    var booking = await MongoHandler.executeQueryFirst(query2, 'Bookings');
    var date = stringToDate(booking.returnDate);
    const formattedDate = formatDateToDayMonthYearHourMinute(date);

    var message = "";
    var message3 = "";

    switch(user.language){

        case "es":
            message = "Esperamos que haya disfrutado mucho en su viaje con Autosplaza. Recuerde que debe dejar el vehículo a el " + formattedDate.toString() + " en la siguiente ubicación.\n";

            message3 = "Si necesita entregarlo en otro lugar, notifíquenoslo en el 922 383 433.";
        break;

        case "de":
            message = "Esperamos que haya disfrutado mucho en su viaje con Autosplaza. Recuerde que debe dejar el vehículo a el " + formattedDate.toString() + " en la siguiente ubicación.\n";

            message3 = "Si necesita entregarlo en otro lugar, notifíquenoslo en el 922 383 433.";
        break;

        default:
            message = "Esperamos que haya disfrutado mucho en su viaje con Autosplaza. Recuerde que debe dejar el vehículo a el " + formattedDate.toString() + " en la siguiente ubicación.\n";

            message3 = "Si necesita entregarlo en otro lugar, notifíquenoslo en el 922 383 433.";
        break;

    }

    sendAnswer(phoneNumber, message);
    await sleep(1000);
    latitude = booking.returnCoords[0];
    longitude = booking.returnCoords[1];
    twilio.sendLocationMessage(phoneNumber, latitude, longitude);
    await sleep(1000);
    sendAnswer(phoneNumber, message3);

}

async function startRating(phoneNumber){
    payload = await dialogflow.sendToDialogFlow("startRating", phoneNumber);
    sendAnswer(phoneNumber, "¿Ha ido todo bien durante su viaje con Autosplaza?\n Escriba *Sí* si todo ha ido, *No* en caso contrario.");
}

function GetReturnCar(phoneNumber, license){
    try{
        const imageDir = path.join(__dirname, 'assets/Images/' + license + '/worker');
        const imageFiles = fs.readdirSync(imageDir).filter(file => file.match(/\.(jpg|jpeg|png|gif)$/i));
        //const imageUrls = imageFiles.map(file => `${ngrokUrl}/images/${file}`);
        const imageUrls = imageFiles.map(file => `${ngrokUrl}/Images/${license}/worker/${file}`);
        imageUrls.forEach(element => {
            const modifiedString = element.replace(/ /g, '%20');
            console.log(modifiedString)
            twilio.sendMediaMessage(phoneNumber, modifiedString);
        });

    } catch (error){
        console.error('An error occurred:', error);
    }
}

function getDate(thisDate, interval, type, hours) {
    var newDate;
    var value;
    switch(interval){
        case 's':
            value = hours * 1000;
        break;

        case 'm':
            value = hours * 60 * 1000;
        break;

        case 'h':
            value = hours * 60 * 60 * 1000;
        break;
        
        case 'd':
            value = hours * 60 * 60 * 24 * 1000;
        break;
    }

    switch(type){
        case 'sum':
            newDate = new Date(thisDate.getTime() + value);
        break;

        case 'subs':
            newDate = new Date(thisDate.getTime() - value);
        break;
    }

  return newDate;
}

function stringToDate(dateString){
    const [datePart, timePart] = dateString.split(" ");

    const [year, month, day] = datePart.split("-");
    const [hours, minutes] = timePart.split(":");

    const date = new Date(year, month - 1, day, hours, minutes);
    return date;
}

function formatDateToDayMonthYearHourMinute(date) {
    const options = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
  
    return new Intl.DateTimeFormat("en-GB", options).format(date);
}

function sendAnswer(phoneNumber, message){
    twilio.sendTextMessage(phoneNumber, message);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function scheduleMessage(timeToSend, phoneNumber, message){
    try{
        console.log('Setting message for: ' + phoneNumber + ' at ' + timeToSend)
        const job = schedule.scheduleJob(timeToSend, async function(){
            sendAnswer(phoneNumber, message);
        });
    }catch (error){
        console.error('An error occurred:', error);
    }
}

async function scheduleConfirmationMessage(userId, timeToSend, phoneNumber){
    try{
        console.log('Setting message for: ' + phoneNumber + ' at ' + timeToSend)
        const jsonString ='{"userID": "' + userId + '","date": "' + timeToSend + '","type": "confirm"}';
        const json = await JSON.parse(jsonString);
        /*const query = { userID: userId, type: "confirm" }
        const pMesagge = await MongoHandler.executeQuery(query, "ProgrammedMessages");
        if(pMesagge.length > 0){
            result = await MongoHandler.executeUpdate(query, json, "ProgrammedMessages");
        } else{
            MongoHandler.executeInsert(json, "ProgrammedMessages", true)
        }*/
        MongoHandler.executeInsert(json, "ProgrammedMessages", true);
    }catch (error){
        console.error('An error occurred:', error);
    }
}

async function scheduleReturnMessage(userId, timeToSend, phoneNumber){
    try{
        console.log('Setting message for: ' + phoneNumber + ' at ' + timeToSend)
        const jsonString ='{"userID": "' + userId + '","date": "' + timeToSend + '","type": "return"}';
        const json = await JSON.parse(jsonString);
        /*const query = { userID: userId, type: "return" }
        const pMesagge = await MongoHandler.executeQuery(query, "ProgrammedMessages");
        if(pMesagge.length > 0){
            result = await MongoHandler.executeUpdate(query, json, "ProgrammedMessages");
        } else{
            MongoHandler.executeInsert(json, "ProgrammedMessages", true);
        }*/
        MongoHandler.executeInsert(json, "ProgrammedMessages", true);
    }catch (error){
        console.error('An error occurred:', error);
    }
}

async function scheduleRatingMessage(userId, timeToSend, phoneNumber){
    try{
        console.log('Setting message for: ' + phoneNumber + ' at ' + timeToSend)
        const jsonString ='{"userID": "' + userId + '","date": "' + timeToSend + '","type": "rate"}';
        const json = await JSON.parse(jsonString);
        /*const query = { userID: userId, type: "rate" }
        const pMesagge = await MongoHandler.executeQuery(query, "ProgrammedMessages");
        if(pMesagge.length > 0){
            result = await MongoHandler.executeUpdate(query, json, "ProgrammedMessages");
        } else{
            MongoHandler.executeInsert(json, "ProgrammedMessages", true)
        }*/
        MongoHandler.executeInsert(json, "ProgrammedMessages", true);
    }catch (error){
        console.error('An error occurred:', error);
    }
}

module.exports = {
    languageSelector, firstMessage, confirmationMessage, askConfirmationMessage, returnMessage, startRating, sendAnswer,
    scheduleMessage, scheduleConfirmationMessage, scheduleReturnMessage, scheduleRatingMessage
};