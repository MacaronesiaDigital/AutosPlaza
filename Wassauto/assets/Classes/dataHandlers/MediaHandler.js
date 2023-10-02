const axios = require('axios');
const fs = require('fs');
const config = require("../../../config");
const MongoHandler = require('../connections/MongoBDConnection') ;

const accountSid = config.TWILIO_ACC_SID;
const authToken = config.TWILIO_AUTH;

const authHeader = 'Basic ' + Buffer.from(accountSid+':'+authToken).toString('base64');

const util = require('util');
const mkdirPromise = util.promisify(fs.mkdir);

//Saves the photo sent by the client.
async function saveUserPhoto(url, phoneNumber){
  await MongoHandler.connectToDatabase();

  console.log(url)
  const photoUrl = url;
  const query = { phones: phoneNumber };
  var user = await MongoHandler.executeQueryFirst(query, 'Users');
  bookingCode = user.lastBooking.toString();
  const query2 = { codBook: bookingCode };
  var booking = await MongoHandler.executeQueryFirst(query2, 'Bookings');
  bookingLicense = booking.license;

  await MongoHandler.disconnectFromDatabase();

  await mkdirPromise('./Wassauto/assets/Images/Cars/'+bookingLicense+'/client', { recursive: true });

  // Download the photo using Axios
  axios
    .get(photoUrl, { headers: { 'Authorization': authHeader,}, responseType: 'arraybuffer' })
    .then((response) => {
      // Save the photo using the desired filename
      fs.writeFile('./Wassauto/assets/Images/Cars/'+bookingLicense+'/client/clientImage.jpg', response.data, (error) => {
        if (error) {
          console.error('Failed to save photo:', error);
        } else {
          console.log('Photo saved successfully:', 'clientImage.jpg');
        }
      });
    })
    .catch((error) => {
      console.error('Failed to download photo:', error);
    });
}

//Saves the location sent by the client.
async function saveUserLocation(phoneNumber, Latitude, Longitude) {
  await MongoHandler.connectToDatabase();

  const query = { phones: phoneNumber };
  var user = await MongoHandler.executeQueryFirst(query, 'Users');
  bookingCode = user.lastBooking.toString();
  const query2 = { codBook: bookingCode };
  var booking = await MongoHandler.executeQueryFirst(query2, 'Bookings');
  const query3 = { license: booking.license };
  const updateData = { locationCoords: [Latitude, Longitude] };
  await MongoHandler.executeUpdate(query3, updateData, "Flota");

  await MongoHandler.disconnectFromDatabase();
}

module.exports = {
    saveUserPhoto, saveUserLocation
};