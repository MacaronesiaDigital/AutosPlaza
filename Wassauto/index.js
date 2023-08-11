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

const { ObjectId, Long } = require('mongodb');

const cron = require('node-cron');
const schedule = require('node-schedule');

const path = require('path');

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
const uReturnJSON = __dirname + '/assets/JSONs/UnformattedReturn.json';

const vehicleJSON = __dirname + '/assets/JSONs/VehicleData.json';
const bookingJSON = __dirname + '/assets/JSONs/BookingData.json';
const returnJSON = __dirname + '/assets/JSONs/ReturnData.json';
const userJSON = __dirname + '/assets/JSONs/USerData.json';

app.use('/assets/Images', express.static(__dirname + '/assets/Images'));

app.post('/upload_files', upload.single('files'), async (req, res) =>{

    console.log(testCounter)
    
    testCounter++;

    if(testCounter === 1){
        
            console.log(req.body['dataType']);
            var filePath = unformattedJSON;
            switch (req.body['dataType']) {
                case 'vehicle':
                    filePath = uVehicleJSON;
                    break;
    
                case 'booking':
                    filePath = uBookingJSON;
                    break;

                case 'return':
                    filePath = uReturnJSON;
                    break;
            }
    
            excelPath = './Wassauto/UploadedExcel/savedExcel.xls';
            if (await fs.existsSync(excelPath)) {
                await fs.unlink(excelPath, (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
            }
    
            // Wait for the file to be copied
            await fs.copyFile(req.file['path'], excelPath, (err) => {
                if (err) {
                    console.log(err);
                } else{
                    fs.unlink(req.file['path'], (err) => {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
            });
    
            console.log(filePath)

            // Wait for the JSON conversion
            await JSONFormatter.saveJsonToFile(convertExcelToJson(req.file['path']), filePath);
    
            //res.json({ message: "Successfully uploaded files" });

            switch (req.body['dataType']) {
                case 'vehicle':
                    await processVehicles();
                    break;
    
                case 'booking':
                    await processBookings();
                    break;
                
                case 'return':
                    await processReturns();
                    break;
            }

    } else{
        testCounter = 0;
    }
});

async function uploadFiles(req, res) {
    try {
        console.log(req.body['dataType']);
        var filePath = unformattedJSON;
        switch (req.body['dataType']) {
            case 'vehicle':
                filePath = uVehicleJSON;
                break;

            case 'booking':
                filePath = uBookingJSON;
                break;

            case 'return':
                filePath = uReturnJSON;
                break;
        }

        excelPath = './Wassauto/UploadedExcel/savedExcel.xls';
        if (fs.existsSync(excelPath)) {
            fs.unlink(excelPath, (err) => {
                if (err) {
                    console.log(err);
                }
            });
        }

        // Wait for the file to be copied
        await new Promise((resolve, reject) => {
            fs.copyFile(req.file['path'], excelPath, function (err) {
                if (err) reject(err);
                console.log('Saved!');
                resolve();
            });
        });

        // Wait for the JSON conversion
        await JSONFormatter.saveJsonToFile(convertExcelToJson(req.file['path']), filePath);

        //res.json({ message: "Successfully uploaded files" });
        switch (req.body['dataType']) {
            case 'vehicle':
                processVehicles();
                break;

            case 'booking':
                processBookings();
                break;

            case 'return':
                processReturns();
                break;
        }

    } catch (error) {
        console.error('An error occurred:', error);
    }
}

var testCounter = 0;
var testCounter2 = 0;

//app.use(express.static(path.join(__dirname, 'assets/BookingDetails')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MongoDB connection and API endpoint as shown in previous examples

app.get('/', async (req, res) => {
  try {
    const query = {}
    const objects = await MongoHandler.executeQuery(query, 'Bookings');

    const objectsWithDetails = [];
    for (const object of objects) {
      const query2 = { _id: new ObjectId(object.codClient) }
      const details = await MongoHandler.executeQueryFirst(query2, 'Users');
      if (details) {
        object.name = details.name + " " + details.surname;
        object.phones = details.phones;
        object.email = details.email;
        objectsWithDetails.push(object);
      }
    }

    const objects2 = await MongoHandler.executeQuery(query, 'Flota');

    res.render('index', { objects: objectsWithDetails, objects2: objects2 });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal server error');
  }
});

app.get("/prueba3", async (req, res) =>{
    //res.sendFile(__dirname + '/file_upload/BookingDetails.html');
    const query = {}
    const objects = await MongoHandler.executeQuery(query, 'Bookings');
    console.log(objects);
});

app.get("/prueba", async (req, res) =>{
    res.send("Esto es una prueba");

    console.log(testCounter)
    
    testCounter++;

    if(testCounter === 1){
        //firstMessage();

        /* vehicles
    var uFile = require(uVehicleJSON);
    JSONFormatter.vehicleJSON(uFile, vehicleJSON);
    const FVehicleJSON = require(vehicleJSON);
    MongoHandler.saveJsonToMongo(FVehicleJSON, 'Flota', true, 'license');
    //*/

        /* users
        var uFile = require(uBookingJSON);
        await JSONFormatter.userJSON(uFile, userJSON)
        const FUserJSON = require(userJSON);
        MongoHandler.saveJsonToMongo(FUserJSON, 'Users', true, 'phones');
        //*/

        /* bookings
        var uFile = require(uBookingJSON);
        await JSONFormatter.bookingJSON(uFile, bookingJSON)
        const FBookingJSON = require(bookingJSON);
        var timesArr = await MongoHandler.saveJsonToMongo(FBookingJSON, 'Bookings', true, 'codBook');
        //setDeliveryMessages(timesArr);
        //*/
        processBookings();
    
    } else{
        testCounter = 0;
    }
});

app.get("/prueba2", async (req, res) =>{
    res.send("Esto es una prueba");

    if(testCounter2 === 0){
        returnMessage();
        testCounter2++;
    } else{
        testCounter2 = 0;
    }
});

app.listen(process.env.PORT || 5000, function () {
    console.log("Server is live on port 5000");
});

app.post("/twilio", express.json(), async function (req, res) {
    try{
        let phone = req.body.WaId;
        let receivedMessage = req.body.Body;
        console.log(req.body);
        if(req.body.Latitude && req.body.Longitude) {
            saveUserLocation(req.body.Latitude, req.body.Longitude);
        }
        if(req.body.MediaUrl0){
            saveUserPhoto(req.body.MediaUrl0);
        } else{
            const params = {
                platform: "WHATSAPP", // Add the platform information as "whatsapp"
            };
            //payload = await dialogflow.sendToDialogFlow(receivedMessage, phone);
            await sleep(1000);
        }
    }catch (error){
        console.error('An error occurred:', error);
    }
    
})

//Cada intent apunta al método en la clase de la entidad que le corresponde 
app.post("/webhook", express.json(), async function (req, res) {
    const immediateResponse = {
        fulfillmentMessages: [{ text: { text: ["Processing your request..."] } }],
      };
    res.json(immediateResponse);
    try{
        const userAgent = req.headers['user-agent'];
        //console.log(userAgent);

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

        //console.log(req.body.MediaUrl);
        if(req.body.MediaUrl){
            //saveUserPhoto();
        }

        function GetDialogAnswer(agent){
            message = req.body.queryResult.fulfillmentText;
            sendAnswer(phoneNumber, message);
        }

        /*==============================================================================
        ||Database querys                                                             ||
        ==============================================================================*/

        /*async function firstMessage(){
        
            const query = { phones: phoneNumber };
            var user = await MongoHandler.executeQueryFirst(query, 'Users');
            bookingCode = user.lastBooking.toString();
            const query2 = { codBook: bookingCode };
            var booking = await MongoHandler.executeQueryFirst(query2, 'Bookings');
        
            date = new Date();
        
            var message = "Estimado/a cliente, gracias por elegir a Autosplaza como medio de transporte en la magnífica isla de Tenerife 🏔️. Le ofrecemos los datos de su reserva a continuación:\n"+ 
            "Nº de confirmación: " + booking.codBook + "\n" +
            "Fecha de la reserva:" + date.toString() + "\n" +
            "Lugar de entrega:" + booking.deliveryLocation + "\n" +
            "Vehículo:" + booking.license;
            
            var message2 = "\n\nTenga un feliz día 🌞."
            
            sendAnswer(phoneNumber, message);
            await sleep(1000);
            GetReturnCar();
            await sleep(1000);
            sendAnswer(phoneNumber, message);

        }*/

        
        async function confirmationMessage(){
            var phoneNumber = "34671152525";

            console.log("tets")
        
            var message = "¡Gracias por confirmar! Puede consultarme dudas sobre su vehículo escribiendo el número del menú dudas y eligiendo cualquiera de ellas. Para cualquier otra duda, estaremos encantados de atenderle llamando al 922 383 433. Disfrute de su viaje con Autosplaza."
            //"Esperamos que haya ido todo bien durante su recogida. Puede consultarme dudas sobre su vehículo pulsando sobre el menú dudas y eligiendo cualquiera de ellas. Para cualquier otra duda, estaremos encantados de atenderle llamando al 922 383 433. Disfrute de su viaje con Autosplaza."
        
            sendAnswer(phoneNumber, message);

            payload = await dialogflow.sendToDialogFlow("Dudas", phoneNumber);
        }
        
        async function failConfirmation(){
            GetDialogAnswer();
            await sleep(5000);
            payload = await dialogflow.sendToDialogFlow("Dudas", phoneNumber);
        }

        async function GetReturnTime(){
            try{
                const query = { phones: phoneNumber };
                var user = await MongoHandler.executeQueryFirst(query, 'Users');
                userID = user._id.toString();
                const query2 = { codClient: userID };
                var booking = await MongoHandler.executeQueryFirst(query2, 'Bookings');
                sendAnswer(phoneNumber, "Tienes que devolver el coche el " + booking.returnDate);
            }catch (error){
                console.error('An error occurred:', error);
            }
        }

        async function GetReturnUbication(){
            try{
                const query = { phones: phoneNumber };
                var user = await MongoHandler.executeQueryFirst(query, 'Users');
                userID = user._id.toString();
                const query2 = { codClient: userID };
                var booking = await MongoHandler.executeQueryFirst(query2, 'Bookings');
                //sendAnswer(phoneNumber, booking.returnLocation);
                latitude = '28.079820';
                longitude = '-15.451709';
                twilio.sendLocationMessage(phoneNumber, latitude, longitude);
            }catch (error){
                console.error('An error occurred:', error);
            }
        }

        async function GetReturnCar(){
            try{
                frontCarImgURL = 'https://cars4all.es/wp-content/uploads/thememakers/cardealer/3/2105/main/64ba371915c42.jpg';
                sideCarImgURL = 'https://cars4all.es/wp-content/uploads/thememakers/cardealer/3/2105/main/64ba3ab92491c.jpg';
                backCarImgURL = 'https://cars4all.es/wp-content/uploads/thememakers/cardealer/3/2105/main/64ba387b1aa66.jpg';
                insideCarImgURL = 'https://cars4all.es/wp-content/uploads/thememakers/cardealer/3/2105/main/64ba3988b8364.jpg';
                parkingImgURL = 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fcdn.bignewsnetwork.com%2Fcus1623131278799.jpg';
                
                twilio.sendImageMessage(phoneNumber, imgURL);
            }catch (error){
                console.error('An error occurred:', error);
            }
        }

        async function GetCombustible(){
            try{
                const query = { phones: phoneNumber };
                var user = await MongoHandler.executeQueryFirst(query, 'Users');
                bookingCode = user.lastBooking.toString();
                const query2 = { codBook: bookingCode };
                var booking = await MongoHandler.executeQueryFirst(query2, 'Bookings');
                bookingLicense = booking.license;
                //const query2 = { license: bookingLicense };
                const query3 = { license: "7508 KJB" };
                var car = await MongoHandler.executeQueryFirst(query3, 'Details');
                var Combustible = "El combustible que lleva su vehículo es " + car.combustible.toString();
                sendAnswer(phoneNumber, Combustible);
            }catch (error){
                console.error('An error occurred:', error);
            }
        }

        async function GetSide(){
            try{
                const query = { phones: phoneNumber };
                var user = await MongoHandler.executeQueryFirst(query, 'Users');
                bookingCode = user.lastBooking.toString();
                const query2 = { codBook: bookingCode };
                var booking = await MongoHandler.executeQueryFirst(query2, 'Bookings');
                bookingLicense = booking.license;
                //const query2 = { license: bookingLicense };
                const query3 = { license: "7508 KJB" };
                var car = await MongoHandler.executeQueryFirst(query3, 'Details');
                var Side = "Puede encontrar el acceso al tanque de gasolina a la " + car.deposit_side.toString();
                sendAnswer(phoneNumber, Side);
            }catch (error){
                console.error('An error occurred:', error);
            }
        }

        /*==============================================================================
        ||Functions                                                                   ||
        ==============================================================================*/

        function saveUserPhoto(url){
            console.log(url)
            const photoUrl = url;
            // Download the photo using Axios
            axios
              .get(photoUrl, { responseType: 'arraybuffer' })
              .then((response) => {
                // Save the photo using the desired filename
                fs.writeFile('./Wassauto/assets/Images/newFilename.jpg', response.data, (error) => {
                  if (error) {
                    console.error('Failed to save photo:', error);
                  } else {
                    console.log('Photo saved successfully:', newFilename);
                  }
                });
              })
              .catch((error) => {
                console.error('Failed to download photo:', error);
              });
        }
        
        /*==============================================================================
        ||Intent map                                                                  ||
        ==============================================================================*/

        //console.log(req.body.queryResult);

        var intentMap = new Map();
        intentMap.set('helloThere-intent', GetDialogAnswer);

        intentMap.set('booking-confirmation - yes', confirmationMessage);
        intentMap.set('booking-confirmation - no', failConfirmation);

        intentMap.set('booking-questions', GetDialogAnswer);
        intentMap.set('unsolvable-questions', GetDialogAnswer);
        intentMap.set('return-car-time', GetReturnTime);
        intentMap.set('return-car-ubication', GetReturnUbication);
        intentMap.set('return-key-location', GetDialogAnswer);
        intentMap.set('tenerife-activities', GetDialogAnswer);
        intentMap.set('other-questions', GetDialogAnswer);

        //intentMap.set('rating-context', GetDialogAnswer);
        intentMap.set('rating-positive', GetDialogAnswer);
        intentMap.set('rating-negative', GetDialogAnswer);

        intentMap.set('question-combustible', GetCombustible);
        intentMap.set('question-deposit', GetSide);
        intentMap.set('question-startCar', GetDialogAnswer);
        intentMap.set('find-key', GetDialogAnswer);

        intentMap.set('Default Fallback Intent', GetDialogAnswer)
        intentMap.set('Default Welcome Intent', GetDialogAnswer)

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

function saveUserPhoto(url){
    console.log(url)
    const photoUrl = url;
    // Download the photo using Axios
    axios
      .get(photoUrl, { responseType: 'arraybuffer' })
      .then((response) => {
        // Save the photo using the desired filename
        fs.writeFile('./Wassauto/assets/Images/newFilename.jpg', response.data, (error) => {
          if (error) {
            console.error('Failed to save photo:', error);
          } else {
            console.log('Photo saved successfully:', newFilename);
          }
        });
      })
      .catch((error) => {
        console.error('Failed to download photo:', error);
      });
}

async function saveUserLocation(Latitude, Longitude) {
    var phoneNumber = "34671152525";

    const query = { phones: phoneNumber };
    var user = await MongoHandler.executeQueryFirst(query, 'Users');
    bookingCode = user.lastBooking.toString();
    const query2 = { codBook: bookingCode };
    var booking = await MongoHandler.executeQueryFirst(query2, 'Bookings');
    const query3 = { _id: new ObjectId(booking._id) };
    const updateData = { locationCoords: [Latitude, Longitude] };
    MongoHandler.executeUpdate(query3, updateData, "Bookings");
}


/*==============================================================================
||Database querys                                                             ||
==============================================================================*/

async function GetReturnCar(){
    var phoneNumber = "34671152525";
    try{
        frontCarImgURL = 'https://cars4all.es/wp-content/uploads/thememakers/cardealer/3/2105/main/64ba371915c42.jpg';
        //sideCarImgURL = 'https://cars4all.es/wp-content/uploads/thememakers/cardealer/3/2105/main/64ba3ab92491c.jpg';
        //backCarImgURL = 'https://cars4all.es/wp-content/uploads/thememakers/cardealer/3/2105/main/64ba387b1aa66.jpg';
        //insideCarImgURL = 'https://cars4all.es/wp-content/uploads/thememakers/cardealer/3/2105/main/64ba3988b8364.jpg';
        parkingImgURL = 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fcdn.bignewsnetwork.com%2Fcus1623131278799.jpg';
        
        twilio.sendImageMessage(phoneNumber, frontCarImgURL);
        //twilio.sendImageMessage(phoneNumber, sideCarImgURL);
        //twilio.sendImageMessage(phoneNumber, backCarImgURL);
        //twilio.sendImageMessage(phoneNumber, insideCarImgURL);
        twilio.sendImageMessage(phoneNumber, parkingImgURL);
    }catch (error){
        console.error('An error occurred:', error);
    }
}

async function firstMessage(){

    if(testCounter > 0){
        return;
    }

    var phoneNumber = "34671152525";

    const query = { phones: phoneNumber };
    var user = await MongoHandler.executeQueryFirst(query, 'Users');
    bookingCode = user.lastBooking.toString();
    const query2 = { codBook: bookingCode };
    var booking = await MongoHandler.executeQueryFirst(query2, 'Bookings');

    date = new Date();
    const formattedDate = formatDateToDayMonthYearHourMinute(date);

    var message = "Estimado/a cliente, gracias por elegir a Autosplaza como medio de transporte en la magnífica isla de Tenerife 🏔️. Le ofrecemos los datos de su reserva a continuación:\n"+ 
    "Nº de confirmación: " + booking.codBook + "\n" +
    "Fecha de la reserva: " + formattedDate.toString() + "\n" +
    "Lugar de entrega: " + booking.deliveryLocation + "\n" +
    "Vehículo: " + booking.license +
    "\n\nTenga un feliz día 🌞."
    
    sendAnswer(phoneNumber, message);

    await sleep(30000);

    askConfirmationMessage();
}

async function askConfirmationMessage(){

    var phoneNumber = "34671152525";

    const query = { phones: phoneNumber };
    var user = await MongoHandler.executeQueryFirst(query, 'Users');
    bookingCode = user.lastBooking.toString();
    const query2 = { codBook: bookingCode };
    var booking = await MongoHandler.executeQueryFirst(query2, 'Bookings');

    var date = stringToDate(booking.deliveryDate);
    const formattedDate = formatDateToDayMonthYearHourMinute(date);

    var message = "ℹ️ Le damos la bienvenida a Tenerife, esta es toda la información que necesita para recoger su vehículo.\n\n" +
    "Hora de recogida:" + formattedDate.toString() + "\n"+ 
    "Medio de acceso:" + "La llave se encuentra en una caja fuera del coche, el código es: 1234\n\n"
    
    var message3 = "Escriba *OK* si todo ha ido bien, escriba *NO*, si no es así."

    sendAnswer(phoneNumber, message);
    await sleep(1000);
    latitude = '28.079820';
    longitude = '-15.451709';
    twilio.sendLocationMessage(phoneNumber, latitude, longitude);
    await sleep(1000);
    GetReturnCar();
    await sleep(30000);
    payload = await dialogflow.sendToDialogFlow("confirmBooking", phoneNumber);
    sendAnswer(phoneNumber, message3);
}

async function returnMessage(){

    var phoneNumber = "34671152525";

    const query = { phones: phoneNumber };
    var user = await MongoHandler.executeQueryFirst(query, 'Users');
    bookingCode = user.lastBooking.toString();
    const query2 = { codBook: bookingCode };
    var booking = await MongoHandler.executeQueryFirst(query2, 'Bookings');
    var date = stringToDate(booking.returnDate);
    const formattedDate = formatDateToDayMonthYearHourMinute(date);

    var message = "Esperamos que haya disfrutado mucho en su viaje con Autosplaza. Recuerde que debe dejar el vehículo a el " + formattedDate.toString() + " en la siguiente ubicación.\n";

    var message3 = "Si necesita entregarlo en otro lugar, notifíquenoslo en el 922 383 433.";

    sendAnswer(phoneNumber, message);
    await sleep(1000);
    latitude = '28.079820';
    longitude = '-15.451709';
    twilio.sendLocationMessage(phoneNumber, latitude, longitude);
    await sleep(1000);
    sendAnswer(phoneNumber, message3);

    await sleep(30000);

    payload = await dialogflow.sendToDialogFlow("startRating", phoneNumber);

    sendAnswer(phoneNumber, "¿Ha ido todo bien durante su viaje con Autosplaza?\n Escriba *Sí* si todo ha ido, *No* en caso contrario.");
}

/*async function GetReturnTime(userID){
    console.log(userID)
    try{
        result = await MongoHandler.executeQuery({_id: new ObjectId(userID)});
        dateOfReturn = result[0]['dateOfReturn'];
        twilio.sendTextMessage(GetNumber(session), dateFormatter(dateOfReturn));
    }catch (error){
        console.error('An error occurred:', error);
    }
}

async function GetReturnUbication(userID){
    try{
        console.log(await MongoHandler.executeQuery({_id: new ObjectId(userID)}));
    }catch (error){
        console.error('An error occurred:', error);
    }
}*/

/*==============================================================================
||Excel saving and exporting to json                                          ||
==============================================================================*/

async function processBookings(){
    var uFile = require(uBookingJSON);

    await JSONFormatter.bookingJSON(uFile, bookingJSON);
    const FBookingJSON = require(bookingJSON);
    var timesArr = await MongoHandler.saveJsonToMongo(FBookingJSON, 'Bookings', true, 'codBook');
    await setDeliveryMessages(timesArr);
}

async function processReturns(){
    var uFile = require(uReturnJSON);

    await JSONFormatter.returnJSON(uFile, returnJSON);
    //const FReturnJSON = require(returnJSON);   
    //var timesArr = await MongoHandler.saveJsonToMongo(FBookingJSON, 'Bookings', true, 'codBook');
/*
    var phoneNumber = "34671152525";

    const query = { phones: phoneNumber };
    var user = await MongoHandler.executeQueryFirst(query, 'Users');
    bookingCode = user.lastBooking.toString();
    const query2 = { codBook: bookingCode };
    var booking = await MongoHandler.executeQueryFirst(query2, 'Bookings');
    const query3 = { _id: ObjectId(booking._id) };
    const updateData = { returnLocation: "location", accesories: "acc" };

    console.log(FReturnJSON);*/

    //await MongoHandler.executeUpdate(query3, updateData, "Bookings");
}

async function processVehicles(){
    var uFile = fixJson(uVehicleJSON);
    uFile = JSON.parse(JSON.stringify(uFile));
    JSONFormatter.vehicleJSON(uFile, vehicleJSON);
    const FVehicleJSON = require(vehicleJSON);
    await MongoHandler.saveJsonToMongo(FVehicleJSON, 'Flota', true, 'license');
}

function convertExcelToJson(filePath) {
    // Load the Excel file
    const workbook = XLSX.readFile(filePath);

    // Assume the first sheet of the Excel file
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Convert the sheet data to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    return jsonData;
}

async function fixJson(file){
    fs.readFile(file, 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading the file:', err);
          return;
        }

        console.log(data);
      
        // Call the removeByteOrderMark function to remove the BOM
        const jsonDataWithoutBOM = removeByteOrderMark(data);
      
        try {
          // Parse the JSON data
          const jsonData = JSON.parse(jsonDataWithoutBOM);
          console.log(jsonData)
          return jsonData;
        } catch (error) {
          console.error('Error parsing JSON data:', error);
        }
      });

    let removeByteOrderMark = a => a[0] === "\ufeff" ? a.slice(1) : a;
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
            //console.log("Tiempo");
            sendAnswer(phoneNumber, message);
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}