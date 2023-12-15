
const fs = require('fs');
const util = require('util');
const unlinkPromise = util.promisify(fs.unlink);
const writeFilePromise = util.promisify(fs.writeFile);
const rmFilePromise = util.promisify(fs.unlink);
const readFilePromise = util.promisify(fs.readFile);
const XLSX = require('xlsx');

const { ObjectId } = require('mongodb');

const MongoHandler = require('../connections/MongoBDConnection');
const JSONFormatter = require('../dataHandlers/JSONFormatter');
const MessageHandler = require('../dataHandlers/MessageHandler');

var testCounter = 0;

const uBookingJSONPath = '../../JSONs/UnformattedBooking.json';
const BookingJSONPath = '../../JSONs/BookingData.json';

const uVehicleJSONPath = '../../JSONs/UnformattedVehicle.json';
const vehicleJSONPath = '../../JSONs/VehicleData.json';

//Processes all the booking data from the excel and saves it as a unformatted json.
async function processBookings(){

    if (fs.existsSync(__dirname + '/' + BookingJSONPath)) {
        await unlinkPromise(__dirname + '/' + BookingJSONPath);
    }

    const uBookingJSON = JSON.parse(await readFilePromise(__dirname + '/' + uBookingJSONPath));

    await writeFilePromise(__dirname + '/' + BookingJSONPath, "", { flag: 'wx' } );

    try{
        const inputDate = new Date();
        const formattedDate = `${inputDate.getFullYear()}-${(inputDate.getMonth() + 1).toString().padStart(2, '0')}-${inputDate.getDate().toString().padStart(2, '0')} ${inputDate.getHours().toString().padStart(2, '0')}:${inputDate.getMinutes().toString().padStart(2, '0')}`;
        

        await MongoHandler.connectToDatabase();

        success = await JSONFormatter.bookingJSON(uBookingJSON, __dirname + '/' + BookingJSONPath);

        successCode = success[0];
        failedNumbers = success[1];

        const FBookingJSON = JSON.parse(await readFilePromise(__dirname + '/' + BookingJSONPath));
        var bookingsArr = await MongoHandler.saveJsonToMongo(FBookingJSON, 'Bookings', true, 'codBook');
        //await setDeliveryMessages(timesArr);

        testCounter = 0;
        for(ii = 0; ii < bookingsArr.length; ii++) {
            element = bookingsArr[ii];
            console.log(element.deliveryDate + " - " + formattedDate);
            let pastDate = element.deliveryDate > formattedDate;
            console.log(pastDate);
            if(pastDate){
                const codClient = element.codClient;
                let query = { _id: new ObjectId(codClient) }
                let user = await MongoHandler.executeQueryFirst(query, "Users");
                if(user.active == 0){
                    console.log(user.phones[0]);
                    //firstMessage(user.phones[0]);
                    await MessageHandler.languageSelector(user.phones[0]);
                    const updateData = { active: 1 };
                    const result = await MongoHandler.executeUpdate(user, updateData, "Users");
                    //console.log(result);
                } 
            } else{
                console.log("false");
            }
        }

        await MongoHandler.disconnectFromDatabase();

        rmFilePromise(__dirname + '/' + BookingJSONPath);

        return [true, successCode, failedNumbers];

    }catch (error) {
        console.error('Error fetching data:', error);
        return [false];
    }
}

//Processes all the vehicle data from the excel and saves it as a unformatted json.
async function processVehicles(){
    
    if (fs.existsSync(__dirname + '/' + vehicleJSONPath)) {
        await unlinkPromise(__dirname + '/' + vehicleJSONPath);
    }

    const uVehicleJSON = JSON.parse(await readFilePromise(__dirname + '/' + uVehicleJSONPath));

    await writeFilePromise(__dirname + '/' + vehicleJSONPath, "", { flag: 'wx' } );

    try{
        await MongoHandler.connectToDatabase();

        await JSONFormatter.vehicleJSON(uVehicleJSON, __dirname + '/' + vehicleJSONPath);

        const FVehicleJSON = JSON.parse(await readFilePromise(__dirname + '/' + vehicleJSONPath));
        
        await MongoHandler.saveJsonToMongo(FVehicleJSON, 'Flota', true, 'license');

        await MongoHandler.disconnectFromDatabase();
        
        rmFilePromise(__dirname + '/' + vehicleJSONPath);
        
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

//Returns the data from an excel file as a json.
function convertExcelToJson(filePath) {
    // Load the Excel file
    const workbook = XLSX.readFile(filePath);

    // Assume the first sheet of the Excel file
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Convert the sheet data to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    return jsonData;
}

module.exports = {
    convertExcelToJson, processVehicles, processBookings,
};