const express = require('express');
const app = express();
const axios = require('axios');
const dfff = require('dialogflow-fulfillment');
const { Card, Suggestion, Image } = require('dialogflow-fulfillment');
'use strict';
const fs = require('fs');
const { readFile } = require('fs/promises')
const XLSX = require('xlsx');
const { filter } = require('lodash');
const Twilio = require('twilio');
const twilio = require('./assets/Classes/connections/twilio');
const dialogflow = require('./assets/Classes/connections/dialogflow');

const multer = require('multer');
const upload = multer({ dest: __dirname + '/assets/uploads' });

const { ObjectId } = require('mongodb');

const cron = require('node-cron');
const schedule = require('node-schedule');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*==============================================================================
||Referencias a las clases que manejan cada tipo de entidad                   ||
==============================================================================*/
const MongoHandler = require('./assets/Classes/connections/MongoBDConnection') ;
const JSONFormatter = require('./assets/Classes/dataHandlers/JSONFormatter') ;
const { time } = require('console');

/*==============================================================================
||Referencias a json                                                          ||
==============================================================================*/
const unformattedJSON = __dirname + '/assets/JSONs/UnformattedData.json';
const uVehicleJSON = __dirname + '/assets/JSONs/UnformattedVehicle.json';
const uBookingJSON = __dirname + '/assets/JSONs/UnformattedBooking.json';

const vehicleJSON = __dirname + '/assets/JSONs/VehicleData.json';
const bookingJSON = __dirname + '/assets/JSONs/BookingData.json';
const userJSON = __dirname + '/assets/JSONs/USerData.json';

app.use('/assets/Images', express.static(__dirname + '/assets/Images'));

app.post('/upload_files', upload.single('files'), uploadFiles);

async function uploadFiles(req, res) {
    try{
        
        console.log(req.body['dataType']);
        var filePath = unformattedJSON;
        switch(req.body['dataType']){
            case 'vehicle':
                filePath = uVehicleJSON;
            break;

            case 'booking':
                filePath = uBookingJSON;
            break;
        }

        excelPath = './Wassauto/UploadedExcel/savedExcel.xls';
        if (fs.existsSync(excelPath)) {
            await fs.unlink(excelPath, (err) => { 
                if (err) { 
                    console.log(err); 
                } 
            });
        }
        fs.copyFile(req.file['path'], excelPath, function (err) {
            if (err) throw err;
            console.log('Saved!');
        });
        saveJsonToFile(convertExcelToJson(req.file['path']), filePath);
        res.json({ message: "Successfully uploaded files" });
        await fs.unlink(req.file['path'], (err) => { 
            if (err) { 
                console.log(err); 
            } 
        });
    }catch (error){
        console.error('An error occurred:', error);
    }
}

app.get("/prueba", async (req, res) =>{
    res.send("Esto es una prueba");

    /*
    var uFile = require(uVehicleJSON);
    JSONFormatter.vehicleJSON(uFile, vehicleJSON);
    const FVehicleJSON = require(vehicleJSON);
    MongoHandler.saveJsonToMongo(FVehicleJSON, 'Flota', true, 'license');
    //*/

    /*
    var uFile = require(uBookingJSON);
    await JSONFormatter.userJSON(uFile, userJSON)
    const FUserJSON = require(userJSON);
    MongoHandler.saveJsonToMongo(FUserJSON, 'Users', true, 'phones');
    //*/

    ///*
    var uFile = require(uBookingJSON);
    await JSONFormatter.bookingJSON(uFile, bookingJSON)
    const FBookingJSON = require(bookingJSON);
    var timesArr = await MongoHandler.saveJsonToMongo(FBookingJSON, 'Bookings', true, 'codBook');
    setDeliveryMessages(timesArr);
    //*/
});

app.listen(process.env.PORT || 5000, function () {
    console.log("Server is live on port 5000");
});

app.post("/twilio", express.json(), async function (req, res) {
    try{
        let phone = req.body.WaId;
        let receivedMessage = req.body.Body;
        payload = await dialogflow.sendToDialogFlow(receivedMessage, phone);
    }catch (error){
        console.error('An error occurred:', error);
    }
    
})

//Cada intent apunta al método en la clase de la entidad que le corresponde 
app.post("/webhook", express.json(), async function (req, res) {
    try{
        const userAgent = req.headers['user-agent'];
        console.log(userAgent);

        // Extract the platform from the userAgent header
        let Platform = userAgent;
        /*
        dataHandler.checkCard(req.body.originalDetectIntentRequest.source);
        */
        var url = req.headers.host + '/' + req.url;
        const agent = new dfff.WebhookClient({
        	request: req,   
            response: res,
            platform: Platform
        });

        phoneNumber = GetNumber(req.body.session);

        function GetDialogAnswer(agent){
            message = req.body.queryResult.fulfillmentText;
            sendAnswer(phoneNumber, message);
        }

        /*==============================================================================
        ||Database querys                                                             ||
        ==============================================================================*/

        async function GetReturnTime(){
            try{
                const query = { phones: phoneNumber };
                var user = await MongoHandler.executeQueryFirst(query, 'Users');
                userID = user._id.toString();
                const query2 = { codClient: userID };
                var booking = await MongoHandler.executeQueryFirst(query2, 'Bookings');
                sendAnswer(phoneNumber, booking.returnDate);
            }catch (error){
                console.error('An error occurred:', error);
            }
            /*
            try{
                date = new Date();
                date = getDate(date, 's', 'subs', 15);
                scheduleMessage(date, phoneNumber, "test");
            }catch (error){
                console.error('An error occurred:', error);
            }
            */
        }

        async function GetReturnUbication(){
            try{
                const query = { phones: phoneNumber };
                var user = await MongoHandler.executeQueryFirst(query, 'Users');
                userID = user._id.toString();
                const query2 = { codClient: userID };
                var booking = await MongoHandler.executeQueryFirst(query2, 'Bookings');
                sendAnswer(phoneNumber, booking.returnLocation);
            }catch (error){
                console.error('An error occurred:', error);
            }
        }

        async function GetReturnCar(){
            try{
                imgURL = 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fi.computer-bild.de%2Fimgs%2F1%2F3%2F9%2F2%2F8%2F5%2F2%2F3%2F0x0-Cybertruck_01-34e3059e2d2f7970.jpg';
                twilio.sendImageMessage(phoneNumber, imgURL);
            }catch (error){
                console.error('An error occurred:', error);
            }
        }

        
        /*==============================================================================
        ||Intent map                                                                  ||
        ==============================================================================*/

        console.log(req.body.queryResult);

        var intentMap = new Map();
        intentMap.set('helloThere-intent', GetDialogAnswer);
        intentMap.set('booking-questions', GetDialogAnswer);
        intentMap.set('unsolvable-questions', GetDialogAnswer);
        intentMap.set('return-car-time', GetReturnTime);
        intentMap.set('return-car-ubication', GetReturnUbication);
        intentMap.set('return-key-location', GetReturnCar);
        intentMap.set('tenerife-activities', GetDialogAnswer);
        intentMap.set('other-questions', GetDialogAnswer);
        intentMap.set('rating-context', GetDialogAnswer);
        intentMap.set('rating-positive', GetDialogAnswer);
        intentMap.set('rating-negative', GetDialogAnswer);
        intentMap.set('Default Fallback Intent', GetDialogAnswer)

        agent.handleRequest(intentMap);
    }catch (error){
        console.error('An error occurred:', error);
    }
});

function GetNumber(session){
    parts = session.split('/');
    return parts.pop();
}

function sendAnswer(phoneNumber, message){
    twilio.sendTextMessage(phoneNumber, message);
}


/*==============================================================================
||Database querys                                                             ||
==============================================================================*/

async function GetReturnTime(){
    try{
        result = await MongoHandler.executeQuery({_id: new ObjectId('64a585ae7b355318c1969328')});
        dateOfReturn = result[0]['dateOfReturn'];
        twilio.sendTextMessage(GetNumber(session), dateFormatter(dateOfReturn));
    }catch (error){
        console.error('An error occurred:', error);
    }
}

async function GetReturnUbication(){
    try{
        console.log(await MongoHandler.executeQuery({_id: new ObjectId('64a2b1a55d853ddfb206bd43')}));
    }catch (error){
        console.error('An error occurred:', error);
    }
}

/*==============================================================================
||Excel saving and exporting to json                                          ||
==============================================================================*/

function convertExcelToJson(filePath) {
    // Load the Excel file
    const workbook = XLSX.readFile(filePath);

    // Assume the first sheet of the Excel file
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Convert the sheet data to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    return jsonData;
}

function saveJsonToFile(jsonData, filePath) {
    // Convert the JSON data to a string
    const jsonString = JSON.stringify(jsonData, null, 2);

    // Write the JSON string to the file
    fs.writeFile(filePath, jsonString, (err) => {
      if (err) {
        console.error('Error writing JSON file:', err);
      } else {
        console.log('JSON file saved successfully.');
      }
    });
}

function formatJson(jsonToFormat){
    JSONFormatter.vehicleJSON(jsonToFormat);
}



/*==============================================================================
||Scheduled tasks functions                                                   ||
==============================================================================*/

async function setDeliveryMessages(collectionArray){
    const query = { };
    userArray = await MongoHandler.executeQuery(query, 'Users');
    console.log(userArray);
    try{
        console.log(collectionArray.length);
        console.log(userArray.length);
        //console.log(collectionArray)
        for(ii = 0; ii < collectionArray.length; ii++) {
            element = collectionArray[ii];
            console.log(ii + ' - ' + (collectionArray.length-1));
            console.log(element.codClient);
            var user = '';
            userArray.forEach(element2 => {
                console.log(element2._id.toString())
                if(element2._id.toString() === element.codClient){
                    user = element2;
                }
            });

            if(user != ''){
                console.log(element);
                console.log(user);
                var bookingPhone = user.phones[0];
                var date = stringToDate(element.deliveryDate);
                date = getDate(date, 'h', 'subs', 24);
                console.log(date + ' - ' + bookingPhone);
                scheduleMessage(date, bookingPhone, "test");

                var date2 = stringToDate(element.returnDate);
                date2 = getDate(date2, 'h', 'subs', 24);
                console.log(date2 + ' - ' + bookingPhone);
                scheduleMessage(date2, bookingPhone, "test");
            } else{
                console.log('Usuario no encontrado');
            }

        }
    }catch (error){
        console.error('An error occurred:', error);
    }
}

async function scheduleMessage(timeToSend, phoneNumber, message){
    try{
        console.log('Setting message for: ' + phoneNumber + ' at ' + timeToSend)
        const job = schedule.scheduleJob(timeToSend, function(){
            console.log("Tiempo");
            //sendAnswer(phoneNumber, message);
        });
    }catch (error){
        console.error('An error occurred:', error);
    }
}

function dateFormatter(date){
    const formatter = new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        timeZone: 'UTC'
    });
    
    return formatter.format(date);
}

function stringToDate(dateString){
    const [datePart, timePart] = dateString.split(" ");

    const [year, month, day] = datePart.split("-");
    const [hours, minutes] = timePart.split(":");

    const date = new Date(year, month - 1, day, hours, minutes);
    return date;
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