const config = require('./config');

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser'); // Import the body-parser library
const app = express();
const axios = require('axios');
const dfff = require('dialogflow-fulfillment');
'use strict';
const fs = require('fs');
const util = require('util');
const copyFilePromise = util.promisify(fs.copyFile);
const unlinkPromise = util.promisify(fs.unlink);
const mkdirPromise = util.promisify(fs.mkdir);
const rmPromise = util.promisify(fs.rm);
const existsPromise = util.promisify(fs.existsSync);
const twilio = require('./assets/Classes/connections/twilio');
const dialogflow = require('./assets/Classes/connections/dialogflow');

const multer = require('multer');
const upload = multer({ dest: __dirname + '/assets/uploads' });

var cors = require('cors');
app.use(cors());

const { ObjectId, Long } = require('mongodb');

const path = require('path');

const ngrokUrl = config.NGROKURL;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
      secret: 'secret-key',
      resave: false,
      saveUninitialized: true,
    })
  );
  

/*==============================================================================
||Referencias a las clases que manejan cada tipo de entidad                   ||
==============================================================================*/
const MongoHandler = require('./assets/Classes/connections/MongoBDConnection') ;
const JSONFormatter = require('./assets/Classes/dataHandlers/JSONFormatter') ;
const { time } = require('console');

const MessageHandler = require('./assets/Classes/dataHandlers/MessageHandler') ;
const MediaHandler = require('./assets/Classes/dataHandlers/MediaHandler') ;
const DataProcessor = require('./assets/Classes/dataHandlers/DataProcessor') ;

/*==============================================================================
||Referencias a json                                                          ||
==============================================================================*/
const unformattedJSON = __dirname + '/assets/JSONs/UnformattedData.json';
const uVehicleJSON = __dirname + '/assets/JSONs/UnformattedVehicle.json';
const uBookingJSON = __dirname + '/assets/JSONs/UnformattedBooking.json';

const imagesDir = __dirname + '/assets/Images';

var testCounter = 0;
var testCounter2 = 0;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/Images', express.static(__dirname + '/assets/Images'));
app.use('/Videos', express.static(__dirname + '/assets/Videos'));

app.listen(process.env.PORT || 5000, function () {
    console.log("Server is live on port 5000");
});

app.post("/twilio", express.json(), async function (req, res) {
    testCounter2++;
    console.log("test: " + testCounter2);
    try{
        let phone = req.body.WaId;
        let receivedMessage = req.body.Body;

        const query = { phones: phone };
        var user = await MongoHandler.executeQueryFirstNC(query, 'Users');
        if(user == undefined){
            console.log("test");
            return;
        }
        userID = user._id;
        const query2 = { codClient: userID };
        var booking = await MongoHandler.executeQueryFirstNC(query2, 'Bookings');

        if(booking != undefined){
            console.log(userID);
            return;
        }

        console.log(req.body);
        if(req.body.Latitude && req.body.Longitude || req.body.MediaUrl0){
            if(req.body.Latitude && req.body.Longitude) {
                await MediaHandler.saveUserLocation(phone, req.body.Latitude, req.body.Longitude);
                GetDialogAnswerBBDD2("userLocation", phone);
            }
            if(req.body.MediaUrl0){
                await MediaHandler.saveUserPhoto(req.body.MediaUrl0, phone);
                GetDialogAnswerBBDD2("userPhoto", phone);
            }
        }else{
            payload = await dialogflow.sendToDialogFlow(receivedMessage, phone);
            console.log(payload);
        }

    }catch (error){
        console.error('An error occurred:', error);
        res.sendStatus(500);
    }
});

app.post('/upload_files', upload.single('files'), async (req, res) =>{
        
    console.log(req.body['dataType']);
    var filePath = unformattedJSON;
    switch (req.body['dataType']) {
        case 'vehicle':
            filePath = uVehicleJSON;
            break;
        case 'booking':
            filePath = uBookingJSON;
            break;
    }

    excelPath = './Wassauto/UploadedExcel/savedExcel.xls';
    if (fs.existsSync(excelPath)) {
        await unlinkPromise(excelPath);
    }

    await copyFilePromise(req.file['path'], excelPath);

    // Wait for the JSON conversion
    await JSONFormatter.saveJsonToFile(DataProcessor.convertExcelToJson(excelPath), filePath);
    //res.json({ message: "Successfully uploaded files" })
    switch (req.body['dataType']) {
        case 'vehicle':
            await DataProcessor.processVehicles();
            break;
        case 'booking':
            await DataProcessor.processBookings();
            break;
    }

    await unlinkPromise(req.file['path']);
    await unlinkPromise(excelPath);
    await unlinkPromise(filePath);
    
    res.sendStatus(200);

});

//app.use(express.static(path.join(__dirname, 'assets/BookingDetails')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', async (req, res) => {
    res.redirect('/login');
});

app.get('/login', async (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  fs.readFile('./Wassauto/users.json', (err, data) => {
    if (err) {
      console.error('Error al leer el archivo de usuarios:', err);
      return res.redirect('/login');
    }

    const users = JSON.parse(data);
    const user = users.find(u => u.username === username);
    if (user.password == password) {
      req.session.user = user;
      res.redirect('/inicio');
    } else {
      res.redirect('/login');
    }
  });
});

app.get('/logout', async (req, res) => {
    req.session.user = {}
    res.redirect('/login');
});

app.get('/inicio', async (req, res) => {
  if (req.session.user) {
    const user = req.session.user;
    res.render('inicio.ejs', { user: user});    
  } else {
    res.redirect('/login');
  }
});

app.get('/ficheros', async (req, res) => {
    if (req.session.user && req.session.user.username.includes("ventas")) {
      // Aquí obtienes los datos del usuario autenticado desde la sesión
      const user = req.session.user;
      res.render('ficheros.ejs', { user: user}); // Asegúrate de pasar user y cars a la plantilla
    } else {
      res.redirect('/reservas');
      console.log("Solo los usuarios de ventas pueden acceder a este espacio")
    }
});

app.get('/reservas', async (req, res) => {
    if (req.session.user) {
      // Aquí obtienes los datos del usuario autenticado desde la sesión
      const user = req.session.user;
      try {
        await MongoHandler.connectToDatabase();
        const query = {}
        const objects = await MongoHandler.executeQuery(query, 'Bookings');
        /*
        const objectsWithDetails = [];
        for (const object of objects) {
          const query2 = { _id: new ObjectId(object.codClient) }
          const details = await MongoHandler.executeQueryFirst(query2, 'Users');
          //console.log(details)
          if (details) {
            object.name = details.name + " " + details.surname;
            object.phones = details.phones;
            object.email = details.email;
            objectsWithDetails.push(object);
          }
        }*/
        await MongoHandler.disconnectFromDatabase();
        res.render('reservas.ejs', { user: user,  reservations: objects }); 
      } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal server error');
        return res.redirect('/inicio');
      }
    } else {
      res.redirect('/login');
    }
});

app.get('/vehiculos', async (req, res) => {
    if (req.session.user) {
        // Aquí obtienes los datos del usuario autenticado desde la sesión
        const user = req.session.user;
        try {
            await MongoHandler.connectToDatabase();
            const query = {}
            const objects = await MongoHandler.executeQuery(query, 'Flota');
            
            await MongoHandler.disconnectFromDatabase();

            res.render('vehiculos.ejs', { user: user,  cars: objects }); 
        } catch (error) {
            console.error('Error fetching data:', error);
            res.status(500).send('Internal server error');
            return res.redirect('/inicio');
        }
      } else {
        res.redirect('/login');
      }
});

app.get('/details-page', async (req, res) => {
    const objectId = req.query.id;
    const query = { _id: new ObjectId(objectId) };
    const objectType = req.query.type;
    let item;
    try {
        await MongoHandler.connectToDatabase();
        
        if (objectType === 'Booking') {
          // Fetch the booking item from the Booking table based on the objectId
          item = await MongoHandler.executeQueryFirst(query, "Bookings");
          //console.log(item)
          res.render('formulario', { item });
        } else if (objectType === 'Car') {
          // Fetch the car item from the Car table based on the objectId
          item = await MongoHandler.executeQueryFirst(query, "Flota");
          res.render('vehiculoform', { item });
        } else {
          // Handle other cases
          res.send('Invalid object type');
        }
        await MongoHandler.disconnectFromDatabase();
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal server error');
        return res.redirect('/inicio');
    }
});

app.get('/formulario', async (req, res) => {
    res.render('formulario');
});

app.get('/vehiculoform', async (req, res) => {
    res.render('vehiculoform');
});

app.post('/updateBooking', upload.any('carImages'), async (req, res) => {
    if(testCounter == 1){
        testCounter = 0; 
        return;
    } else{
        testCounter++;
    }
    try {
        await MongoHandler.connectToDatabase();

        const objectId = req.body['id'];  
        console.log('this id: ' + objectId);
        
        if(!objectId){
            console.log(req.body);
            res.status(200).send('Booking not updated.');
        } else{
            const query = { _id: new ObjectId(objectId) };
            const thisBooking = await MongoHandler.executeQueryFirst(query, "Bookings");

            let thisAccesories = "";
            if(!req.body['accessories']){
                thisAccesories = thisBooking.accesories;
            } else{
                thisAccesories = req.body['accessories'];
            }
        
            let thisParking = "";
            if(!req.body['parking']){
                if(thisBooking.parking){
                    thisParking = thisBooking.parking;
                }else{
                    thisParking = 'None';
                }
            } else{
                thisParking = req.body['parking'].toString();
            }
        
            let thisNotes = "";
            if(!req.body['notes']){
                if(thisBooking.notes){
                    thisNotes = thisBooking.notes;
                }else{
                    thisNotes = 'None';
                }
            } else{
                thisNotes = req.body['notes'];
            }
        
            let thisLatitude = "";
            if(!req.body['latitude']){
                if(thisBooking.locationCoords[0]){
                    thisLatitude = thisBooking.locationCoords[0];
                }else{
                    thisLatitude = 'None';
                }
            } else{
                thisLatitude = req.body['latitude'];
            }
        
            let thisLongitude = "";
            if(!req.body['longitude']){
                if(thisBooking.locationCoords[1]){
                    thisLongitude = thisBooking.locationCoords[1];
                }else{
                    thisLongitude = 'None';
                }
            } else{
                thisLongitude = req.body['longitude'];
            }
        
            const updateData = { accesories: thisAccesories, parking:  thisParking, notes: thisNotes, returnCoords: [thisLatitude, thisLongitude] };
        
            //console.log(updateData);
        
            result = await MongoHandler.executeUpdate(query, updateData, "Bookings");

            const imagePath = imagesDir + '/Cars/' + thisBooking.license + '/worker';
            if(fs.existsSync(imagePath)) {
                await rmPromise(imagePath, {recursive: true});
            }

            if (req.files.length > 0) {
                const files = req.files;
                for (let i = 0; i < files.length; i++) {
                    const element = files[i];
                    try {
                        // Create the directory
                        await mkdirPromise(imagePath, { recursive: true });
                        const imageFilePath = imagePath + '/' + element['originalname'];
                        // Copy the file to the directory
                        await copyFilePromise(element['path'], imageFilePath);
                        // Delete the original file
                        await unlinkPromise(element['path']);
                    } catch (err) {
                        console.error('Error processing file ' + element['originalname'] + ':', err);
                    }
                }
            }

            let booking = await MongoHandler.executeQueryFirst( { _id: new ObjectId(objectId) } , "Bookings");
            let user = await MongoHandler.executeQueryFirst( { _id: new ObjectId(booking.codClient) }, "Users" ); 

            await MessageHandler.confirmationMessage(user.phones[0]);
        }
        
        await MongoHandler.disconnectFromDatabase();

    } catch (error) {
      console.error('Error while updating booking:', error);
      res.status(500);
    }

    res.sendStatus(200);
});

app.post('/updateCar', async (req, res) => {
    try {
        
        await MongoHandler.connectToDatabase();
        
        console.log(req.body);
        const objectId = req.body['id'];  
        
        const query = { _id: new ObjectId(objectId) };
        car = await MongoHandler.executeQueryFirst(query, 'Flota');
        
        let thisDeposit = req.body['depType'];
        let thisTrunk = req.body['trunkType'];
        let thisReverse = req.body['revType'];
        let thisNotes = req.body['notes'];

        console.log(car);

        if(!thisDeposit){
            thisDeposit = car.depositType;
        }
        if(!thisTrunk){
            thisTrunk = car.trunkType;
        }
        if(!thisReverse){
            thisReverse = car.reverseType;
        }
        if(!thisNotes){
            thisNotes = car.notes;
        }

        thisDeposit = thisDeposit.toString();
        thisTrunk = thisTrunk.toString();
        thisReverse = thisReverse.toString();
        thisNotes = thisNotes.toString();

        const updateData = { depositType: thisDeposit, trunkType: thisTrunk, reverseType: thisReverse, notes: thisNotes };

        console.log(updateData);

        await MongoHandler.executeUpdate(query, updateData, "Flota");    
        res.status(200);
        
        await MongoHandler.disconnectFromDatabase();
    } catch (error) {
      console.error('Error while updating the car:', error);
      res.status(500);
    }

    res.sendStatus(200);
});

/*
app.get('/', async (req, res) => {
    if(testCounter == 1){
        testCounter = 0; 
        return;
    } else{
        testCounter++;
    }
    try {
      const query = {}
      const objects = await MongoHandler.executeQuery(query, 'Bookings');

      const objectsWithDetails = [];
      for (const object of objects) {
        const query2 = { _id: new ObjectId(object.codClient) }
        const details = await MongoHandler.executeQueryFirst(query2, 'Users');
        //console.log(details)
        if (details) {
          object.name = details.name + " " + details.surname;
          object.phones = details.phones;
          object.email = details.email;
          objectsWithDetails.push(object);
        }
      }

      //console.log(objectsWithDetails);

      const objects2 = await MongoHandler.executeQuery(query, 'Flota');

      res.render('index', { objects: objectsWithDetails, objects2: objects2 });
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).send('Internal server error');
    }
});*/

//Cada intent apunta al método en la clase de la entidad que le corresponde 
app.post("/webhook", express.json(), async function (req, res) {

    //console.log(res);
    const immediateResponse = {
        fulfillmentMessages: [{ text: { text: ["Processing your request..."] } }],
      };
    //res.json(immediateResponse);
    try{
        // Extract the platform from the userAgent header
        let Platform = req.body.originalDetectIntentRequest.source;
        
        var url = req.headers.host + '/' + req.url;
        const agent = new dfff.WebhookClient({
        	request: req,   
            response: res,
            platform: Platform
        });

        phoneNumber = GetNumber(req.body.session);

        let currentIntent = req.body.queryResult.intent.displayName;

        //console.log(req.body.MediaUrl);
        if(req.body.MediaUrl){
            //saveUserPhoto();
        }

        async function GetDialogAnswer(agent){
            message = await req.body.queryResult.fulfillmentText;

            sendAnswer(phoneNumber, message);
        }
        
        async function GetDialogAnswerBBDD(agent){

            const query = { phones: phoneNumber };
            var user = await MongoHandler.executeQueryFirstNC(query, 'Users');
            
            const query2 = { intent: currentIntent }
            intentResponse = await MongoHandler.executeQueryFirstNC(query2, 'Responses');
            let thisLang = "en";
            if(user.language){
                thisLang = user.language;
            }
            message = await intentResponse["text"+thisLang];

            sendAnswer(phoneNumber, message);
        }

        /*==============================================================================
        ||Database querys                                                             ||
        ==============================================================================*/

        async function userLanguage(){
            try{
                const query = { phones: phoneNumber };
                var user = await MongoHandler.executeQueryFirstNC(query, 'Users');
                userID = user._id.toString();
                setUserLanguage(userId, lang);
            }catch (error){
                console.error('An error occurred:', error);
            }
        }

        async function succesConfirmation(){
            await GetDialogAnswerBBDD();
            await RemoveNoConfirm();
            DefaultFallback();
        }
        
        async function failConfirmation(){
            await GetDialogAnswerBBDD();
            await RemoveNoConfirm();
            DefaultFallback();
        }

        async function RemoveNoConfirm(){
            const query = { phones: phoneNumber };
            var user = await MongoHandler.executeQueryFirstNC(query, 'Users');
            const thisUserID = user._id.toString();

            const query2 = { userID: thisUserID, type: "noconfirm" };
    
            await MongoHandler.executeDeleteNC(query2, 'ProgrammedMessages');
        }

        async function GetReturnTime(){
            var returnDate = "";
            try{

                const query = { phones: phoneNumber };
                var user = await MongoHandler.executeQueryFirstNC(query, 'Users');
                userID = user._id.toString();
                const query2 = { codClient: userID };
                var booking = await MongoHandler.executeQueryFirstNC(query2, 'Bookings');
                returnDate = booking.returnDate;

                switch(user.language){
                    case "es":
                        message = "Te dejo por aquí la fecha de entrega del vehículo. " + returnDate + 
                        "\nSi necesita cambiar la hora póngase en contacto con nosotros. Contacte al +34 922 38 32 40 o escriba un Whatsapp al +34 65618 0379."
                    break;
                    
                    case "de":
                        message = "Ich hinterlasse hier das Lieferdatum des Fahrzeugs. "+ returnDate + 
                        "\nWenn Sie die Zeit ändern müssen, kontaktieren Sie uns bitte. Kontaktieren Sie uns unter +34 922 38 32 40 oder schreiben Sie eine Whatsapp an +34 65618 0379.";
                    break;
                    
                    default:
                        message = "I leave you over here the delivery date of the vehicle. " + returnDate + 
                        "\nIf you need to change the time please contact us. Contact +34 922 38 32 40 or write a Whatsapp to +34 65618 0379.";
                    break;
                }

            }catch (error){
                console.error('An error occurred:', error);
            }
        }

        async function GetVehicleInfo(){
            try{

                const query = { phones: phoneNumber };
                var user = await MongoHandler.executeQueryFirstNC(query, 'Users');
                userID = user._id.toString();
                const query2 = { codClient: userID };
                var booking = await MongoHandler.executeQueryFirstNC(query2, 'Bookings');
                const thisLicense = booking.license;
                const query3 = { license: thisLicense};
                const car = await MongoHandler.executeQueryFirstNC(query3, 'Flota');

                console.log(booking);

                var message = ""

                switch(user.language){
                    case "es":
                        message = "Este es el modelo de su vehículo:" + 
                            "\nMatricula: " + car.license +
                            "\nModelo: " + car.model +
                            "\nColor: " + car.color;
                    break;

                    case "de":
                        message = "Este es el modelo de su vehículo:\n" + 
                            "\nMatricula: " + car.license +
                            "\nModelo: " + car.model +
                            "\nColor: " + car.color;
                    break;

                    default:
                        message = "Este es el modelo de su vehículo:\n" + 
                            "\nMatricula: " + car.license +
                            "\nModelo: " + car.model +
                            "\nColor: " + car.color;
                    break;
                }
                
                sendAnswer(phoneNumber, message);
            }catch (error){
                console.error('An error occurred:', error);
            }
        }

        async function GetDepositVideo(){
            try{
                await GetDialogAnswerBBDD();

                const query = { phones: phoneNumber };
                var user = await MongoHandler.executeQueryFirstNC(query, 'Users');
                const userID = user._id.toString();
                const query2 = { codClient: userID };
                var booking = await MongoHandler.executeQueryFirstNC(query2, 'Bookings');
                const query3 = { license: booking.license };
                const car = await MongoHandler.executeQueryFirstNC(query3, 'Flota');

                const videoDir = path.join(__dirname, 'assets/Videos/Details/Deposit/' + car.depositType);
                const videoFiles = fs.readdirSync(videoDir).filter(file => file.match(/\.(mp4|avi)$/i));
                
                const videoUrl = videoFiles.map(file => `${ngrokUrl}/Videos/Details/Deposit/${car.depositType}/${file}`);
                
                videoUrl.forEach(element => {
                    const modifiedString = element.replace(/ /g, '%20');
                    twilio.sendMediaMessage(phoneNumber, modifiedString);
                    twilio.sendTextMessage(phoneNumber, modifiedString);
                });

            }catch (error){
                console.error('An error occurred:', error);
            }
        }
        
        async function GetTrunkVideo(){
            try{
                await GetDialogAnswerBBDD();

                const query = { phones: phoneNumber };
                var user = await MongoHandler.executeQueryFirstNC(query, 'Users');
                userID = user._id.toString();
                const query2 = { codClient: userID };
                var booking = await MongoHandler.executeQueryFirstNC(query2, 'Bookings');
                const query3 = { license: booking.license };
                const car = await MongoHandler.executeQueryFirstNC(query3, 'Flota');

                const videoDir = path.join(__dirname, 'assets/Videos/Details/Trunk/' + car.trunkType);
                const videoFiles = fs.readdirSync(videoDir).filter(file => file.match(/\.(mp4|avi)$/i));

                const videoUrl = videoFiles.map(file => `${ngrokUrl}/Videos/Details/Trunk/${car.trunkType}/${file}`);

                videoUrl.forEach(element => {
                    const modifiedString = element.replace(/ /g, '%20');
                    twilio.sendMediaMessage(phoneNumber, modifiedString);
                    twilio.sendTextMessage(phoneNumber, modifiedString);
                });
            }catch (error){
                console.error('An error occurred:', error);
            }
        }
        
        async function GetReverseVideo(){
            try{
                await await GetDialogAnswerBBDD();

                const query = { phones: phoneNumber };
                var user = await MongoHandler.executeQueryFirstNC(query, 'Users');
                userID = user._id.toString();
                const query2 = { codClient: userID };
                var booking = await MongoHandler.executeQueryFirstNC(query2, 'Bookings');
                const query3 = { license: booking.license };
                const car = await MongoHandler.executeQueryFirstNC(query3, 'Flota');

                const videoDir = path.join(__dirname, 'assets/Videos/Details/Reverse/' + car.reverseType);
                const videoFiles = fs.readdirSync(videoDir).filter(file => file.match(/\.(mp4|avi)$/i));

                const videoUrl = videoFiles.map(file => `${ngrokUrl}/Videos/Details/Reverse/${car.reverseType}/${file}`);

                videoUrl.forEach(element => {
                    const modifiedString = element.replace(/ /g, '%20');
                    twilio.sendMediaMessage(phoneNumber, modifiedString);
                    twilio.sendTextMessage(phoneNumber, modifiedString);
                });
            }catch (error){
                console.error('An error occurred:', error);
            }
        }

        async function GetReturnUbication(){
            try{

                const query = { phones: phoneNumber };
                var user = await MongoHandler.executeQueryFirstNC(query, 'Users');
                userID = user._id.toString();
                const query2 = { codClient: userID };
                var booking = await MongoHandler.executeQueryFirstNC(query2, 'Bookings');
                latitude = booking.locationCoords[0];
                longitude = booking.locationCoords[1];

                twilio.sendLocationMessage(phoneNumber, latitude, longitude);
            }catch (error){
                console.error('An error occurred:', error);
            }
        }

        async function GetReturnCar(license){
            try{

                const imageDir = path.join(__dirname, 'assets/Images/Cars/' + license + '/worker');
                const imageFiles = fs.readdirSync(imageDir).filter(file => file.match(/\.(jpg|jpeg|png|gif)$/i));
                //const imageUrls = imageFiles.map(file => `${ngrokUrl}/images/${file}`);
                const imageUrls = imageFiles.map(file => `${ngrokUrl}/Images/Cars/${license}/worker/${file}`);
                imageUrls.forEach(element => {
                    console.log(element.toString())
                    twilio.sendMediaMessage(phoneNumber, element);
                });
            }catch (error){
                console.error('An error occurred:', error);
            }
        }

        async function GetCombustible(){
            try{
                await await GetDialogAnswerBBDD();
            }catch (error){
                console.error('An error occurred:', error);
            }
        }

        async function GetGeneralGaraje(){

            const query = { location: "Garaje" };
            const locationData = await MongoHandler.executeQueryFirstNC(query, 'Locations');
            var latitude = locationData.latitude;
            var longitude = locationData.longitude;
            
            await await GetDialogAnswerBBDD();
            twilio.sendLocationMessage(phoneNumber, latitude, longitude);
        }
        
        async function GetGeneralParking(){
            const query = { location: "Parking" };
            const locationData = await MongoHandler.executeQueryFirstNC(query, 'Locations');
            var latitude = locationData.latitude;
            var longitude = locationData.longitude;
            
            await await GetDialogAnswerBBDD();
            twilio.sendLocationMessage(phoneNumber, latitude, longitude);
        }

        async function GetCarLocation(){
            await await GetDialogAnswerBBDD();
            await GetReturnUbication();
        }

        /*==============================================================================
        ||Functions                                                                   ||
        ==============================================================================*/

        async function saveUserPhoto(url){
            console.log(url)
            const photoUrl = url;
            const query = { phones: phoneNumber };
            var user = await MongoHandler.executeQueryFirst(query, 'Users');
            bookingCode = user.lastBooking.toString();
            const query2 = { codBook: bookingCode };
            var booking = await MongoHandler.executeQueryFirst(query2, 'Bookings');
            bookingLicense = booking.license;
            // Download the photo using Axios
            axios
              .get(photoUrl, { responseType: 'arraybuffer' })
              .then((response) => {
                // Save the photo using the desired filename
                const newFilePath = './Wassauto/assets/Images/Cars/'+bookingLicense+'/client/clientImage.jpg';
                fs.writeFile(newFilePath, response.data, (error) => {
                  if (error) {
                    console.error('Failed to save photo:', error);
                  } else {
                    console.log('Photo saved successfully:', newFilePath);
                  }
                });
              })
              .catch((error) => {
                console.error('Failed to download photo:', error);
              });
        }

        function GetGeneralAirport1(){
            try{
                GetDialogAnswerBBDD();

                const videoDir = path.join(__dirname, 'assets/Videos/SetLocations/Airport/General');
                const videoFiles = fs.readdirSync(videoDir).filter(file => file.match(/\.(mp4|avi)$/i));

                const videoUrl = videoFiles.map(file => `${ngrokUrl}/Videos/SetLocations/Airport/General/${file}`);

                videoUrl.forEach(element => {
                    const modifiedString = element.replace(/ /g, '%20');
                    twilio.sendMediaMessage(phoneNumber, modifiedString);
                    twilio.sendTextMessage(phoneNumber, modifiedString);
                });

                const imageDir = path.join(__dirname, 'assets/Images/SetLocations/Airport/General');
                const imageFiles = fs.readdirSync(imageDir).filter(file => file.match(/\.(jpg|jpeg|png|gif)$/i));

                const imageUrls = imageFiles.map(file => `${ngrokUrl}/Images/SetLocations/Airport/General/${file}`);
                imageUrls.forEach(element => {
                    const modifiedString2 = element.replace(/ /g, '%20');
                    twilio.sendMediaMessage(phoneNumber, modifiedString2);
                });

            }catch (error){
                console.error('An error occurred:', error);
            }
        }

        function GetGeneralAirport2(){
            try{
                GetDialogAnswerBBDD();

                const videoDir = path.join(__dirname, 'assets/Videos/SetLocations/AirportNorth/General');
                const videoFiles = fs.readdirSync(videoDir).filter(file => file.match(/\.(mp4|avi)$/i));

                const videoUrl = videoFiles.map(file => `${ngrokUrl}/Videos/SetLocations/AirportNorth/General/${file}`);
                videoUrl.forEach(element => {
                    const modifiedString = element.replace(/ /g, '%20');
                    twilio.sendMediaMessage(phoneNumber, modifiedString);
                    twilio.sendTextMessage(phoneNumber, modifiedString);
                });
            }catch (error){
                console.error('An error occurred:', error);
            }
        }

        function GetDeliveryParking(){
            try{
                GetDialogAnswerBBDD();

                const videoDir = path.join(__dirname, 'assets/Images/SetLocations/Parking/Delivery');
                const videoFiles = fs.readdirSync(videoDir).filter(file => file.match(/\.(mp4|avi)$/i));

                const videoUrl = videoFiles.map(file => `${ngrokUrl}/Videos/SetLocations/Parking/Delivery/${file}`);
                videoUrl.forEach(element => {
                    const modifiedString = element.replace(/ /g, '%20');
                    twilio.sendMediaMessage(phoneNumber, modifiedString);
                    twilio.sendTextMessage(phoneNumber, modifiedString);
                });
            }catch (error){
                console.error('An error occurred:', error);
            }
            
        }

        function GetDeliveryAirport(){
            try{
                GetDialogAnswerBBDD();

                const videoDir = path.join(__dirname, 'assets/Videos/SetLocations/Airport/Delivery');
                const videoFiles = fs.readdirSync(videoDir).filter(file => file.match(/\.(mp4|avi)$/i));

                const videoUrl = videoFiles.map(file => `${ngrokUrl}/Videos/SetLocations/Airport/Delivery/${file}`);
                videoUrl.forEach(element => {
                    const modifiedString = element.replace(/ /g, '%20');
                    twilio.sendMediaMessage(phoneNumber, modifiedString);
                    twilio.sendTextMessage(phoneNumber, modifiedString);
                });
            }catch (error){
                console.error('An error occurred:', error);
            }
            
        }
        
        function GetDeliveryGaraje(){
            try{
                const videoDir = path.join(__dirname, 'assets/Videos/SetLocations/Garaje/Delivery');
                const videoFiles = fs.readdirSync(videoDir).filter(file => file.match(/\.(mp4|avi)$/i));
                const videoUrl = videoFiles.map(file => `${ngrokUrl}/Videos/SetLocations/Garaje/Delivery/${file}`);
                videoUrl.forEach(element => {
                    const modifiedString = element.replace(/ /g, '%20');
                    twilio.sendMediaMessage(phoneNumber, modifiedString);
                    twilio.sendTextMessage(phoneNumber, modifiedString);
                });

                const imageDir = path.join(__dirname, 'assets/Images/SetLocations/Garaje/Delivery');
                const imageFiles = fs.readdirSync(imageDir).filter(file => file.match(/\.(jpg|jpeg|png|gif)$/i));
                const imageUrls = imageFiles.map(file => `${ngrokUrl}/Images/SetLocations/Garaje/Delivery/${file}`);
                imageUrls.forEach(element => {
                    const modifiedString2 = element.replace(/ /g, '%20');
                    twilio.sendMediaMessage(phoneNumber, modifiedString2);
                });
            }catch (error){
                console.error('An error occurred:', error);
            }
            GetDialogAnswerBBDD();
            
            
        }

        function GetReturnParking(){
            try{
                GetDialogAnswerBBDD();

                const imageDir = path.join(__dirname, 'assets/Images/SetLocations/Parking/Return');
                const imageFiles = fs.readdirSync(imageDir).filter(file => file.match(/\.(jpg|jpeg|png|gif)$/i));

                const imageUrls = imageFiles.map(file => `${ngrokUrl}/Images/SetLocations/Parking/Return/${file}`);
                imageUrls.forEach(element => {
                    const modifiedString = element.replace(/ /g, '%20');
                    twilio.sendMediaMessage(phoneNumber, modifiedString);
                });
            }catch (error){
                console.error('An error occurred:', error);
            }
            
        }

        function GetReturnAirport(){
            try{
                GetDialogAnswerBBDD();

                const videoDir = path.join(__dirname, 'assets/Videos/SetLocations/Airport/Return');
                const videoFiles = fs.readdirSync(videoDir).filter(file => file.match(/\.(mp4|avi)$/i));

                const videoUrls = videoFiles.map(file => `${ngrokUrl}/Videos/SetLocations/Airport/Return/${file}`);
                videoUrls.forEach(element => {
                    const modifiedString = element.replace(/ /g, '%20');
                    twilio.sendMediaMessage(phoneNumber, modifiedString);
                    twilio.sendTextMessage(phoneNumber, modifiedString);
                });
            }catch (error){
                console.error('An error occurred:', error);
            }
            
        }
        
        function GetReturnGaraje(){
            try{
                GetDialogAnswerBBDD();

                const imageDir = path.join(__dirname, 'assets/Images/SetLocations/Garaje/Return');
                const imageFiles = fs.readdirSync(imageDir).filter(file => file.match(/\.(jpg|jpeg|png|gif)$/i));

                const imageUrls = imageFiles.map(file => `${ngrokUrl}/Images/SetLocations/Garaje/Return/${file}`);
                imageUrls.forEach(element => {
                    const modifiedString = element.replace(/ /g, '%20');
                    twilio.sendMediaMessage(phoneNumber, modifiedString);
                });

                const videoDir = path.join(__dirname, 'assets/Videos/SetLocations/Garaje/Return');
                const videoFiles = fs.readdirSync(videoDir).filter(file => file.match(/\.(mp4|avi)$/i));

                const videoUrls = videoFiles.map(file => `${ngrokUrl}/Videos/SetLocations/Garaje/Return/${file}`);
                videoUrls.forEach(element => {
                    const modifiedString = element.replace(/ /g, '%20');
                    twilio.sendMediaMessage(phoneNumber, modifiedString);
                    twilio.sendTextMessage(phoneNumber, modifiedString);
                });
            }catch (error){
                console.error('An error occurred:', error);
            }

        }

        function GetPayAirport(){
            try{
                //GetDialogAnswerBBDD();

                const videoDir = path.join(__dirname, 'assets/Videos/SetLocations/Airport/Pay');
                const videoFiles = fs.readdirSync(videoDir).filter(file => file.match(/\.(mp4|avi)$/i));

                const videoUrls = videoFiles.map(file => `${ngrokUrl}/Videos/SetLocations/Airport/Pay/${file}`);
                videoUrls.forEach(element => {
                    const modifiedString = element.replace(/ /g, '%20');
                    twilio.sendMediaMessage(phoneNumber, modifiedString);
                    twilio.sendTextMessage(phoneNumber, modifiedString);
                });
            }catch (error){
                console.error('An error occurred:', error);
            }

        }

        function GetPayAirport2(){
            try{
                //GetDialogAnswerBBDD();

                const videoDir = path.join(__dirname, 'assets/Videos/SetLocations/AirportNorth/Pay');
                const videoFiles = fs.readdirSync(videoDir).filter(file => file.match(/\.(mp4|avi)$/i));

                const videoUrls = videoFiles.map(file => `${ngrokUrl}/Videos/SetLocations/AirportNorth/Pay/${file}`);
                videoUrls.forEach(element => {
                    const modifiedString = element.replace(/ /g, '%20');
                    twilio.sendMediaMessage(phoneNumber, modifiedString);
                    twilio.sendTextMessage(phoneNumber, modifiedString);
                });
            }catch (error){
                console.error('An error occurred:', error);
            }

        }

        async function SetSpanishLang(){

            const query = { phones: phoneNumber };
            var user = await MongoHandler.executeQueryFirstNC(query, 'Users');
            
            await setUserLanguage(user._id, "es");
            await MessageHandler.firstMessage(phoneNumber, "es");
        }
        
        async function SetEnglishLang(){

            const query = { phones: phoneNumber };
            var user = await MongoHandler.executeQueryFirstNC(query, 'Users');

            await setUserLanguage(user._id, "en");
            await MessageHandler.firstMessage(phoneNumber, "en");
        }
        
        async function SetDeutschLang(){

            const query = { phones: phoneNumber };
            var user = await MongoHandler.executeQueryFirstNC(query, 'Users');

            await setUserLanguage(user._id, "de");
            MessageHandler.firstMessage(phoneNumber, "de");
        }

        async function DefaultFallback(){
            payload = await dialogflow.sendToDialogFlow("Dudas", phoneNumber,
            "outputContexts: [ { name: 'projects/newagent-nuwa/agent/sessions/"+phoneNumber+"/contexts/helpmenu-followup', lifespanCount: 20, parameters: null } ], action: '',")
        }
        
        /*==============================================================================
        ||Intent map                                                                  ||
        ==============================================================================*/

        console.log(req.body.queryResult);

        var intentMap = new Map();
        
        intentMap.set('Language-Chooser', GetDialogAnswer);
            intentMap.set('Language-Chooser-1', SetSpanishLang);
            intentMap.set('Language-Chooser-2', SetEnglishLang);
            intentMap.set('Language-Chooser-3', SetDeutschLang);


        //intentMap.set('confirmBooking', GetDialogAnswer);
        intentMap.set('booking-confirmation - yes', succesConfirmation);
        intentMap.set('booking-confirmation - no', failConfirmation);


        intentMap.set('helpMenu', GetDialogAnswerBBDD);
        intentMap.set('vehicleDoubts', GetDialogAnswerBBDD);
        intentMap.set('reservationDoubts', GetDialogAnswerBBDD);
        intentMap.set('generalDoubts', GetDialogAnswerBBDD);
        intentMap.set('accidentDoubts', GetDialogAnswerBBDD);


        intentMap.set('vehicleDoubts-1', GetVehicleInfo);
        intentMap.set('vehicleDoubts-2', GetDepositVideo);
        intentMap.set('vehicleDoubts-3', GetDialogAnswerBBDD);
        intentMap.set('vehicleDoubts-4', GetTrunkVideo);
        intentMap.set('vehicleDoubts-5', GetDialogAnswerBBDD);
            intentMap.set('vehicleDoubts-5-1', GetDialogAnswerBBDD);
            intentMap.set('vehicleDoubts-5-2', GetDialogAnswerBBDD);
            intentMap.set('vehicleDoubts-5-3', GetDialogAnswerBBDD);
        intentMap.set('vehicleDoubts-6', GetReverseVideo);


        intentMap.set('reservationDoubts-1', GetCarLocation);
        intentMap.set('reservationDoubts-2', GetDialogAnswerBBDD);
            intentMap.set('reservationDoubts-2-1', GetDialogAnswerBBDD);
            intentMap.set('reservationDoubts-2-2', GetReturnParking);
            intentMap.set('reservationDoubts-2-3', GetReturnAirport);
            intentMap.set('reservationDoubts-2-4', GetReturnGaraje);
        intentMap.set('reservationDoubts-3', GetDialogAnswerBBDD);
        intentMap.set('reservationDoubts-4', GetReturnTime);
        intentMap.set('reservationDoubts-5', GetDialogAnswerBBDD);

        
        intentMap.set('generalDoubts-1', GetDialogAnswerBBDD);
            intentMap.set('generalDoubts-1-1', GetGeneralAirport1);
            intentMap.set('generalDoubts-1-2', GetGeneralAirport2);
        intentMap.set('generalDoubts-2', GetDialogAnswerBBDD);
        intentMap.set('generalDoubts-3', GetDialogAnswerBBDD); 
            intentMap.set('generalDoubts-3-1', GetDialogAnswerBBDD); 
            intentMap.set('generalDoubts-3-2', GetDeliveryParking);
            intentMap.set('generalDoubts-3-3', GetDeliveryAirport);
            intentMap.set('generalDoubts-3-4', GetDeliveryGaraje);
        intentMap.set('generalDoubts-4', GetGeneralGaraje);
        intentMap.set('generalDoubts-5', GetGeneralParking);
        intentMap.set('generalDoubts-6', GetDialogAnswerBBDD);
        intentMap.set('generalDoubts-7', GetDialogAnswerBBDD);
            intentMap.set('generalDoubts-7-1', GetPayAirport);
            intentMap.set('generalDoubts-7-2', GetPayAirport2);
        intentMap.set('generalDoubts-8', GetDialogAnswerBBDD);
        intentMap.set('generalDoubts-9', GetDialogAnswerBBDD);


        intentMap.set('accidentDoubts-1', GetDialogAnswerBBDD);
        intentMap.set('accidentDoubts-2', GetDialogAnswerBBDD);
        intentMap.set('accidentDoubts-3', GetDialogAnswerBBDD);
        intentMap.set('accidentDoubts-4', GetDialogAnswerBBDD);
        intentMap.set('accidentDoubts-5', GetDialogAnswerBBDD);
        intentMap.set('accidentDoubts-6', GetDialogAnswerBBDD);
            intentMap.set('accidentDoubts-6-1', GetDialogAnswerBBDD);
            intentMap.set('accidentDoubts-6-2', GetDialogAnswerBBDD);


        //intentMap.set('rating-context', GetDialogAnswerBBDD);
        intentMap.set('rating-negative', GetDialogAnswerBBDD);
        intentMap.set('rating-positive', GetDialogAnswerBBDD);

        /*
        intentMap.set('booking-questions', GetDialogAnswer);
        intentMap.set('unsolvable-questions', GetDialogAnswer);
        intentMap.set('return-car-time', GetReturnTime);
        intentMap.set('return-car-ubication', GetReturnUbication);
        intentMap.set('return-key-location', GetDialogAnswer);
        intentMap.set('tenerife-activities', GetDialogAnswer);
        intentMap.set('question-combustible', GetCombustible);
        intentMap.set('question-deposit', GetSide);
        intentMap.set('question-startCar', GetDialogAnswer);
        intentMap.set('find-key', GetDialogAnswer);
        intentMap.set('other-questions', GetDialogAnswer);
        */

        intentMap.set('Default Fallback Intent', DefaultFallback);
        intentMap.set('Default Welcome Intent', GetDialogAnswer);

        agent.handleRequest(intentMap);

        agent.end("");

    }catch (error){
        console.error('An error occurred:', error);
        res.status(404).end();
    }
});

function GetNumber(session){
    parts = session.split('/');
    return parts.pop();
}

async function GetDialogAnswerBBDD2(desiredIntent, phoneNumber){

    const query = { phones: phoneNumber };
    var user = await MongoHandler.executeQueryFirstNC(query, 'Users');
    
    const query2 = { intent: desiredIntent }
    intentResponse = await MongoHandler.executeQueryFirstNC(query2, 'Responses');
    let thisLang = "en";
    if(user.language){
        thisLang = user.language;
    }
    message = await intentResponse["text"+thisLang];

    sendAnswer(phoneNumber, message);
}

function sendAnswer(phoneNumber, message){
    twilio.sendTextMessage(phoneNumber, message);
}

/*==============================================================================
||Database querys                                                             ||
==============================================================================*/

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
||Scheduled tasks functions                                                   ||
==============================================================================*/

/*async function setDeliveryMessages(collectionArray){
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
*/

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

function GetLangFromExt(userId, phoneNumber){
    let extension = phoneNumber.toString().substring(0, 2);
    console.log(phoneNumber + " - " + extension);
    let lang = "";
    switch(extension){
        case "34" || "54" || "591" || "56" || "57" || "506" || "53" || "593" || "503" || "240" || "502" || "504" || "52" || "505" || "507" || "595" || "51" || "598" || "58":
            lang = "es"
        break;

        case "49" || "32" || "43" || "423" || "352" || "41":
            lang = "de"
        break;

        default:
            lang = "en"
        break;
    }

    setUserLanguage(userId, lang);
    
}

async function setUserLanguage(userId, lang){
    try{
        switch(lang){

            case "es":

            break;

            case "en":

            break;

            case "de":

            break;

        }

        const query = { _id: new ObjectId(userId) };
        const updateData = { language: lang };
        await MongoHandler.executeUpdateNC(query, updateData, "Users");
    } catch (error){
        console.error('An error occurred:', error);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}