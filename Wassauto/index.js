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
const twilio = require("./twilio");
const dialogflow = require("./dialogflow");

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const { ObjectId } = require('mongodb');

const cron = require('node-cron');
const schedule = require('node-schedule');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


/*==============================================================================
||Referencias a las clases que manejan cada tipo de entidad                   ||
==============================================================================*/
const MongoHandler = require("./assets/Classes/MongoBDConnection.js") ;
/*
const thripsHandler = require("./assets/Classes/ThripsHandler.js") ;
const setosHandler = require("./assets/Classes/SetosHandler.js") ;
const eennHandler = require("./assets/Classes/EENNHandler.js") ;
const dataHandler = require("./assets/Classes/DataHandler.js");
*/

app.use('/assets/Images', express.static(__dirname + '/assets/Images'));

app.post("/upload_files", upload.single("files"), uploadFiles);

async function uploadFiles(req, res) {
    try{
        excelPath = './UploadedExcel/savedExcel.xls';
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
        saveJsonToFile(convertExcelToJson(req.file['path']), './JSON/UnformattedData.json')
        res.json({ message: "Successfully uploaded files" });
    }catch (error){
        console.error('An error occurred:', error);
    }
}

app.get('/prueba', (req, res) =>{
    res.send("Esto es una prueba");
});

app.listen(process.env.PORT || 5000, function () {
    console.log("Server is live on port 5000");
});

app.post("/twilio", express.json(), async function (req, res) {
    try{
        /*
        console.log("req ->", req.body);
        twilio.sendTextMessage(req.body.WaId, req.body.Body);
        result = await MongoHandler.executeQuery({});
        console.log(result);
        res.status(200).json({ ok: true, msg: "Mensaje enviado correctamente" });
        */
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
            sendAnswer(phoneNumber, message)
        }

        /*==============================================================================
        ||Database querys                                                             ||
        ==============================================================================*/

        async function GetReturnTime(){
            try{
                /*const document = {
                name: 'John Doe', // Replace with the desired name value
                dateOfPickup: new Date('2023-07-10'), // Replace with the desired dateOfPickup value
                dateOfReturn: new Date('2023-07-15') // Replace with the desired dateOfReturn value
                };
                MongoHandler.executeInsert(document);*/
                result = await MongoHandler.executeQuery({_id: new ObjectId('64a585ae7b355318c1969328')});
                dateOfReturn = result[0]['dateOfReturn'];
                twilio.sendTextMessage(phoneNumber, dateFormatter(dateOfReturn));
            }catch (error){
                console.error('An error occurred:', error);
            }
            
        }

        async function GetReturnUbication(){
            try{
                console.log("Entro");
                /*latitude = '28.079820';
                longitude = '-15.451709';
                twilio.sendLocationMessage(phoneNumber, latitude, longitude);*/
                const date = new Date(2023, 7, 10, 12, 11, 0);
                scheduleMessage(AddMinutes(date, 1), phoneNumber, "test");
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
        intentMap.set('rating-context', ShowRatingOptions);
        intentMap.set('rating-positive', GetDialogAnswer);
        intentMap.set('rating-negative', GetDialogAnswer);
        intentMap.set('Default Fallback Intent', GetDialogAnswer)

        /*
        intentMap.set('info-thrips-intent', thripsHandler.infoThrips);
        intentMap.set('info-setos-intent', setosHandler.infoSetos);
        intentMap.set('info-eenn-intent', eennHandler.infoEENN2);
        intentMap.set('info-sintomas-intent', thripsHandler.filterThrips);
        intentMap.set('info-cultivos-intent', thripsHandler.filterThrips2);
        intentMap.set('filtro-thrips-intent', thripsHandler.filterThrips3);
        intentMap.set('filtro-setos-intent', setosHandler.filterSetos2);
        intentMap.set('filtro-eenn-intent', eennHandler.filterEENN);
        intentMap.set('fight-thrip-intent', thripsHandler.fightThrip);
        intentMap.set('fight-thrip-intent - eenn-followup', eennHandler.infoEENN);
        intentMap.set('search-setos-intent', eennHandler.getSetos);
        intentMap.set('search-setos-followup - filtro-setos-intent', setosHandler.filterSearchedSetos);
        intentMap.set('search-insects-intent', thripsHandler.identifyThrip);
        intentMap.set('search-insects-followup -insect-size', thripsHandler.filterBySize);
        intentMap.set('-insect-size-followup -visible', thripsHandler.filterBySize);
        */

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

function ShowRatingOptions(req) {

    phoneNumber = GetNumber(req.body.session);

    const buttons = [
        { title: 'Yes', payload: 'yes' },
        { title: 'No', payload: 'no' }
      ];
    
    twilio.sendButtonsToWhatsApp(phoneNumber, buttons);
}

/*==============================================================================
||Database querys                                                             ||
==============================================================================*/

async function GetReturnTime(){
    try{
        /*const document = {
        name: 'John Doe', // Replace with the desired name value
        dateOfPickup: new Date('2023-07-10'), // Replace with the desired dateOfPickup value
        dateOfReturn: new Date('2023-07-15') // Replace with the desired dateOfReturn value
        };
        MongoHandler.executeInsert(document);*/
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

/*==============================================================================
||Scheduled tasks functions                                                   ||
==============================================================================*/

function calculateHour(workTime, hours){
    // Get the current date
    //const currentDate = new Date();
    const modifiedDate = new Date(workTime.getTime() - hours * 60 * 60 * 1000);
    // Use the modified date for scheduling or sending the message
    //console.log(modifiedDate);
    return modifiedDate;
}

function AddMinutes(date, minutes){
    return date.setMinutes(date.getMinutes()+minutes);
}

async function scheduleMessage(timeToSend, phoneNumber, message){
    const job = schedule.scheduleJob(timeToSend, function(){
        console.log("Tiempo");
        twilio.sendButtonsToWhatsApp(phoneNumber, message);
    });
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

function jsonBookingFormatter(json){

}

function jsonReturnFormatter(json){

}

function jsonPickupFormatter(json){

}