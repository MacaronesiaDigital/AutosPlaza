
const fs = require('fs');
const XLSX = require('xlsx');

const { ObjectId, Long } = require('mongodb');

const MongoHandler = require('../connections/MongoBDConnection');
const JSONFormatter = require('../dataHandlers/JSONFormatter');
const MessageHandler = require('../dataHandlers/MessageHandler');

const uVehicleJSON = require('../../JSONs/UnformattedVehicle.json');
const uBookingJSON = require('../../JSONs/UnformattedBooking.json');

const vehicleJSON = require.resolve('../../JSONs/VehicleData.json');
const bookingJSON = require.resolve('../../JSONs/BookingData.json');

async function processBookings(){
    var uFile = uBookingJSON;
    const inputDate = new Date();
    const formattedDate = `${inputDate.getFullYear()}-${(inputDate.getMonth() + 1).toString().padStart(2, '0')}-${inputDate.getDate().toString().padStart(2, '0')} ${inputDate.getHours().toString().padStart(2, '0')}:${inputDate.getMinutes().toString().padStart(2, '0')}`;

    await JSONFormatter.bookingJSON(uFile, bookingJSON);
    const FBookingJSON = require(bookingJSON);
    var bookingsArr = await MongoHandler.saveJsonToMongo(FBookingJSON, 'Bookings', true, 'codBook');
    //await setDeliveryMessages(timesArr);

    testCounter = 0;
    
    for(ii = 0; ii < bookingsArr.length; ii++) {
        element = bookingsArr[ii];
        console.log(element.deliveryDate + " - " + formattedDate);
        let pastDate = element.deliveryDate > formattedDate;
        console.log(pastDate);
        if(pastDate){
            console.log("true");
            let query = { _id: new ObjectId(element.codClient) }
            let user = await MongoHandler.executeQueryFirst(query, "Users");
            console.log(user.phones[0]);
            //firstMessage(user.phones[0]);
            MessageHandler.languageSelector(user.phones[0]);
        } else{
            console.log("false");
        }
    }
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

module.exports = {
    convertExcelToJson, processVehicles, processBookings,
};