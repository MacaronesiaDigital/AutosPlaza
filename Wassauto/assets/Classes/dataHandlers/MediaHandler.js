const axios = require('axios');
const fs = require('fs');
const MongoHandler = require('../connections/MongoBDConnection') ;


const util = require('util');
const copyFilePromise = util.promisify(fs.copyFile);
const unlinkPromise = util.promisify(fs.unlink);
const mkdirPromise = util.promisify(fs.mkdir);
const rmPromise = util.promisify(fs.rm);

async function saveUserPhoto(url, phoneNumber){
  console.log(url)
  const photoUrl = url;
  const query = { phones: phoneNumber };
  var user = await MongoHandler.executeQueryFirst(query, 'Users');
  bookingCode = user.lastBooking.toString();
  const query2 = { codBook: bookingCode };
  var booking = await MongoHandler.executeQueryFirst(query2, 'Bookings');
  bookingLicense = booking.license;

  
  await mkdirPromise('./Wassauto/assets/Images/'+bookingLicense+'/client', { recursive: true });

  // Download the photo using Axios
  axios
    .get(photoUrl, { responseType: 'arraybuffer' })
    .then((response) => {
      // Save the photo using the desired filename
      fs.writeFile('./Wassauto/assets/Images/'+bookingLicense+'/client/newFilename.jpg', response.data, (error) => {
        if (error) {
          console.error('Failed to save photo:', error);
        } else {
          console.log('Photo saved successfully:', 'newFilename.jpg');
        }
      });
    })
    .catch((error) => {
      console.error('Failed to download photo:', error);
    });
}

async function saveUserLocation(Latitude, Longitude) {

    const query = { phones: phoneNumber };
    var user = await MongoHandler.executeQueryFirst(query, 'Users');
    bookingCode = user.lastBooking.toString();
    const query2 = { codBook: bookingCode };
    var booking = await MongoHandler.executeQueryFirst(query2, 'Bookings');
    const query3 = { license: new ObjectId(booking.license) };
    const updateData = { locationCoords: [Latitude, Longitude] };
    await MongoHandler.executeUpdate(query3, updateData, "Flota");
}

module.exports = {
    saveUserPhoto, saveUserLocation
};