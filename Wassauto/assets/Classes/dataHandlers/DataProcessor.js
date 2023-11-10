
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

        await JSONFormatter.bookingJSON(uBookingJSON, __dirname + '/' + BookingJSONPath);

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
                    MessageHandler.languageSelector(user.phones[0]);
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

        return true;

    }catch (error) {
        console.error('Error fetching data:', error);
        return false;
    }
}

//Processes all the vehicle data from the excel and saves it as a unformatted json.
async function processVehicles(){
    const uVehicleJSON = require('../../JSONs/UnformattedVehicle.json');
    const vehicleJSON = require.resolve('../../JSONs/VehicleData.json');
    try{
        await MongoHandler.connectToDatabase();

        var uFile = uVehicleJSON;
        uFile = JSON.parse(JSON.stringify(uFile));
        JSONFormatter.vehicleJSON(uFile, vehicleJSON);
        const FVehicleJSON = require(vehicleJSON);
        await MongoHandler.saveJsonToMongo(FVehicleJSON, 'Flota', true, 'license');

        await MongoHandler.disconnectFromDatabase();
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