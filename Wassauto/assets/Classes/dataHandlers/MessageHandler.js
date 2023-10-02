const config = require('../../../config');

const twilio = require('../connections/twilio');
const dialogflow = require('../connections/dialogflow');

const MongoHandler = require('../connections/MongoBDConnection') ;
const { ObjectId } = require('mongodb');

const fs = require('fs');

const path = require('path');

const ngrokUrl = config.NGROKURL;

var testCounter = 0;

async function languageSelector(phoneNumber){
    payload = await dialogflow.sendToDialogFlow("langChose", phoneNumber);
}

async function firstMessage(phoneNumber, language){

    if(testCounter > 0){
        return;
    }

    try{
        await MongoHandler.connectToDatabase();

        const query = { phones: phoneNumber };
        var user = await MongoHandler.executeQueryFirst(query, 'Users');

        var query2 = { intent: "firstMessage" }
        var responses = await MongoHandler.executeQueryFirst(query2, "Responses");

        var message = responses["text"+language];

        console.log(message);
        
        sendAnswer(phoneNumber, message);

        console.log("test")

        const inputDate = new Date();
        const date = getDate(inputDate, 'm', 'sum', 1);

        bookingCode = user.lastBooking.toString();
        const query3 = { codBook: bookingCode };
        var booking = await MongoHandler.executeQueryFirst(query3, 'Bookings');

        await MongoHandler.disconnectFromDatabase();

        var inputDate2 = stringToDate(booking.returnDate);
        const date2 = getDate(inputDate2, 'd', 'subs', 1);

        console.log(inputDate + " - " + inputDate2);

        const date3 = getDate(inputDate2, 'm', 'sum', 30);
        
    } catch (error){
        console.error('An error occurred:', error);
    }
}

async function confirmationMessage(phoneNumber){

    try{
        await MongoHandler.connectToDatabase();

        const query = { phones: phoneNumber };
        var user = await MongoHandler.executeQueryFirst(query, 'Users');
        bookingCode = user.lastBooking.toString();
        const query2 = { codBook: bookingCode };
        var booking = await MongoHandler.executeQueryFirst(query2, 'Bookings');
        bookingLicense = booking.license.toString();
        const query3 = { license: bookingLicense };
        var car = await MongoHandler.executeQueryFirst(query3, 'Flota');

        var date = stringToDate(booking.deliveryDate);
        const formattedDate = formatDateToDayMonthYearHourMinute(date);

        var message = "";

        switch(user.language){

            case "es":
                message = "ℹ️ Le damos la bienvenida a Tenerife, aquí tiene la información detallada de su coche alquilado:\n\n" +
                "Fecha y hora de recogida: " + formattedDate.toString() + "\n"+ 
                "Lugar de recogida: " + booking.returnLocation + "\n"+ 
                "Modelo: " + car.model + "\n"+
                "Licencia: " + car.license + "\n";

                if(booking.accesories != "None"){

                    message += "Accesorios: \n";

                    if(Array.isArray(booking.accesories)){
                        for (let i = 0; i < booking.accesories.length; i++) {
                            const element = booking.accesories[i];
                        
                            const accQuery = { accValue: element };
                            accesory = await MongoHandler.executeQueryFirst(accQuery, "Accesories");
                        
                            message += "- " + accesory["text" + user.language] + "\n";
                        }
                    } else{
                        const accQuery = { accValue : booking.accesories }
                        accesory = await MongoHandler.executeQueryFirst(accQuery, "Accesories");

                        message += "- " + accesory["text" + user.language] + "\n";
                    }
                
                }

                if(booking.parking != "None"){
                    message += "Parking: " + booking.parking + "\n";
                }

                if(booking.notes != "None"){
                    message += "Notas: " + booking.notes + "\n";
                }

            break;

            case "de":
                message = "ℹ️ Willkommen auf Teneriffa, hier sind die detaillierten Informationen zu Ihrem Mietwagen:\n\n" +
                "Datum und Uhrzeit der Abholung: " + formattedDate.toString() + "\n "+ 
                "Abholort: " + booking.returnLocation + "\n" + 
                "Modell: " + car.model + "\n"+
                "Lizenz: " + car.license + "\n";

                if(booking.accesories != "None"){
                    message += "Zubehör: \n";

                    if(Array.isArray(booking.accesories)){
                        for (let i = 0; i < booking.accesories.length; i++) {
                            const element = booking.accesories[i];
                        
                            const accQuery = { accValue: element };
                            accesory = await MongoHandler.executeQueryFirst(accQuery, "Accesories");
                        
                            message += "- " + accesory["text" + user.language] + "\n";
                        }
                    } else{
                        const accQuery = { accValue : booking.accesories }
                        accesory = await MongoHandler.executeQueryFirst(accQuery, "Accesories");

                        message += "- " + accesory["text" + user.language] + "\n";
                    }
                }

                if(booking.parking != "None"){
                    message += "Parken: " + booking.parking + "\n";
                }

                if(booking.notes != "None"){
                    message += "Notiz: " + booking.notes + "\n";
                }

            break;

            default:
                message = "ℹ️ Welcome to Tenerife, here is the detailed information about your rented car:\n\n" +
                "Pick-up date and time: " + formattedDate.toString() + "\n "+ 
                "Pickup location: " + booking.returnLocation + "\n" +
                "Model: " + car.model + "\n"+
                "License: " + car.license + "\n";

                if(booking.accesories != "None"){
                    message += "Accessories: \n";

                    if(Array.isArray(booking.accesories)){
                        for (let i = 0; i < booking.accesories.length; i++) {
                            const element = booking.accesories[i];
                        
                            const accQuery = { accValue: element };
                            accesory = await MongoHandler.executeQueryFirst(accQuery, "Accesories");
                        
                            message += "- " + accesory["text" + user.language] + "\n";
                        }
                    } else{
                        const accQuery = { accValue : booking.accesories }
                        accesory = await MongoHandler.executeQueryFirst(accQuery, "Accesories");

                        message += "- " + accesory["text" + user.language] + "\n";
                    }
                }
                
                if(booking.parking != "None"){
                    message += "Parking: " + booking.parking + "\n";
                }

                if(booking.notes != "None"){
                    message += "Notes: " + booking.notes + "\n";
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

        await scheduleConfirmationMessage(user._id, date2, phoneNumber);

        const date2_2 = getDate(inputDate2, 'm', 'sum', 30);

        await scheduleNoConfirmationMessage(user._id, date2_2, phoneNumber);
        
        var inputDate3 = stringToDate(booking.returnDate);
        const date3 = getDate(inputDate3, 'd', 'subs', 1);

        console.log(inputDate2 + " - " + inputDate3);

        await scheduleReturnMessage(user._id, date3, phoneNumber);

        const date4 = getDate(inputDate3, 'm', 'sum', 30);

        await scheduleRatingMessage(user._id, date4, phoneNumber);

        await MongoHandler.disconnectFromDatabase();

        //console.log(message);

    } catch(error){
        console.log(error);
    }
}

async function askConfirmationMessage(phoneNumber){
    try{
        await MongoHandler.connectToDatabase();

        const query = { phones: phoneNumber };
        var user = await MongoHandler.executeQueryFirst(query, 'Users');

        var query2 = { intent: "askConfirmation" }
        var responses = await MongoHandler.executeQueryFirst(query2, "Responses");

        await MongoHandler.disconnectFromDatabase();

        var message = responses["text"+user.language];

        payload = await dialogflow.sendToDialogFlow("confirmBooking", phoneNumber);
        sendAnswer(phoneNumber, message);

    } catch(error){
        console.log(error);
    }
}

async function returnMessage(phoneNumber){

    try{
        MongoHandler.connectToDatabase();

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
                message = "Wir hoffen, Sie haben Ihre Reise mit Autosplaza genossen. Vergessen Sie nicht, das Fahrzeug am " + formattedDate.toString() + " an folgendem Ort abzustellen. \n";

                message3 = "Wenn Sie eine andere Lieferung benötigen, informieren Sie uns bitte unter der Nummer 922 383 433.";
            break;

            default:
                message = "We hope you enjoyed your trip with Autosplaza. Remember to leave the vehicle on " + formattedDate.toString() + " in the following location. \n";

                message3 = "If you need it delivered elsewhere, please notify us at 922 383 433.";
            break;

        }

        sendAnswer(phoneNumber, message);
        await sleep(1000);
        latitude = booking.returnCoords[0];
        longitude = booking.returnCoords[1];
        twilio.sendLocationMessage(phoneNumber, latitude, longitude);
        await sleep(1000);
        sendAnswer(phoneNumber, message3);

        MongoHandler.disconnectFromDatabase();
    } catch(error){
        console.log(error);
    }

}

async function startRating(phoneNumber){
    payload = await dialogflow.sendToDialogFlow("startRating", phoneNumber);
}

function GetReturnCar(phoneNumber, license){
    try{
        const imageDir = path.join(__dirname, '../../Images/Cars/' + license + '/worker');
        const imageFiles = fs.readdirSync(imageDir).filter(file => file.match(/\.(jpg|jpeg|png|gif)$/i));
        const imageUrls = imageFiles.map(file => `${ngrokUrl}/Images/Cars/${license}/worker/${file}`);
        imageUrls.forEach(element => {
            const modifiedString = element.replace(/ /g, '%20');
            console.log(modifiedString)
            twilio.sendMediaMessage(phoneNumber, modifiedString);
        });

    } catch (error){
        console.error('An error occurred:', error);
    }
}

async function scheduleConfirmationMessage(userId, timeToSend, phoneNumber){
    try{
        console.log('Setting message for: ' + phoneNumber + ' at ' + timeToSend)
        const jsonString ='{"userID": "' + userId + '","date": "' + timeToSend + '","type": "confirm"}';
        const json = await JSON.parse(jsonString);
        
        const query = { userID: userId.toString(), type: "confirm" }
        const pMesagges = await MongoHandler.executeQuery(query, "ProgrammedMessages");
        console.log("Messages found: " + pMesagges.length);
        if(pMesagges.length > 0){
            for (let index = 0; index < pMesagges.length; index++) {
                const element = pMesagges[index];
                const messageID = element._id;
                const query2 = { _id: new ObjectId(messageID) };
                await MongoHandler.executeDelete(query2, 'ProgrammedMessages');
            }
        } 
        
        await MongoHandler.executeInsert(json, "ProgrammedMessages", true);
        
    }catch (error){
        console.error('An error occurred:', error);
    }
}

async function scheduleNoConfirmationMessage(userId, timeToSend, phoneNumber){
    try{
        console.log('Setting message for: ' + phoneNumber + ' at ' + timeToSend)
        const jsonString ='{"userID": "' + userId + '","date": "' + timeToSend + '","type": "noconfirm"}';
        const json = await JSON.parse(jsonString);
        
        const query = { userID: userId.toString(), type: "noconfirm" }
        const pMesagges = await MongoHandler.executeQuery(query, "ProgrammedMessages");
        console.log("Messages found: " + pMesagges.length);
        if(pMesagges.length > 0){
            for (let index = 0; index < pMesagges.length; index++) {
                const element = pMesagges[index];
                const messageID = element._id;
                const query2 = { _id: new ObjectId(messageID) };
                await MongoHandler.executeDelete(query2, 'ProgrammedMessages');
            }
        } 
        
        await MongoHandler.executeInsert(json, "ProgrammedMessages", true);
        
    }catch (error){
        console.error('An error occurred:', error);
    }
}

async function scheduleReturnMessage(userId, timeToSend, phoneNumber){
    try{
        console.log('Setting message for: ' + phoneNumber + ' at ' + timeToSend)
        const jsonString ='{"userID": "' + userId + '","date": "' + timeToSend + '","type": "return"}';
        const json = await JSON.parse(jsonString);
        
        const query = { userID: userId.toString(), type: "return" }
        const pMesagges = await MongoHandler.executeQuery(query, "ProgrammedMessages");
        console.log("Messages found: " + pMesagges.length);
        if(pMesagges.length > 0){
            for (let index = 0; index < pMesagges.length; index++) {
                const element = pMesagges[index];
                const messageID = element._id;
                const query2 = { _id: new ObjectId(messageID) };
                await MongoHandler.executeDelete(query2, 'ProgrammedMessages');
            }
        } 
        
        await MongoHandler.executeInsert(json, "ProgrammedMessages", true);
    }catch (error){
        console.error('An error occurred:', error);
    }
}

async function scheduleRatingMessage(userId, timeToSend, phoneNumber){
    try{
        console.log('Setting message for: ' + phoneNumber + ' at ' + timeToSend)
        const jsonString ='{"userID": "' + userId + '","date": "' + timeToSend + '","type": "rate"}';
        const json = await JSON.parse(jsonString);
        
        const query = { userID: userId.toString(), type: "rate" }
        const pMesagges = await MongoHandler.executeQuery(query, "ProgrammedMessages");
        console.log("Messages found: " + pMesagges.length);
        if(pMesagges.length > 0){
            for (let index = 0; index < pMesagges.length; index++) {
                const element = pMesagges[index];
                const messageID = element._id;
                const query2 = { _id: new ObjectId(messageID) };
                await MongoHandler.executeDelete(query2, 'ProgrammedMessages');
            }
        } 
        
        await MongoHandler.executeInsert(json, "ProgrammedMessages", true);
    }catch (error){
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

module.exports = {
    languageSelector, firstMessage, confirmationMessage, askConfirmationMessage, returnMessage, startRating, sendAnswer,
    scheduleConfirmationMessage, scheduleReturnMessage, scheduleRatingMessage
};