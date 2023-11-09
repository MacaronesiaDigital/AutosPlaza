const { promisify } = require('util');

const sleep = promisify(setTimeout);

const fs = require('fs');
const XLSX = require('xlsx');

const MongoHandler = require(__dirname + '../../connections/MongoBDConnection') ;

const thisUserJSON = __dirname + '/../../JSONs/ThisUserData.json';


async function vehicleJSON(unformattedJSON, filePath){
    var licenseArray = [];
    var jsonString = "[\n";
    var ii = 0;
    unformattedJSON.forEach(element => {
        if(ii > unformattedJSON.length - 3)
            return;

        var license = ''

        if(element['   Actuales (Vivos)   Listado de Vehículo. Simple.   Ordenado por: Marc-Mod']){
            license = element['   Actuales (Vivos)   Listado de Vehículo. Simple.   Ordenado por: Marc-Mod'].toString();
        } else{
            return;
        }
        
        var obj = new Object();
        /*obj.group = element[Object.keys(element)[1]];
        obj.license  = element[Object.keys(element)[3]];
        obj.model = element[Object.keys(element)[4]];
        obj.color = element[Object.keys(element)[9]];*/
        if(license != ''){
            obj.license  = license;
            licenseArray.push(license);
        } else{
            obj.license = "";
        }
        
        if(element['Fecha :']){
            obj.group = element['Fecha :'];
        } else{
            obj.group = "";
        }

        if(element['__EMPTY']){
            obj.model = element['__EMPTY'];
         }else{
            obj.model = "";
        }

        if(element['__EMPTY_5']){
            obj.color = element['__EMPTY_5'];
        } else{
            obj.color = "";
        }

        jsonString += JSON.stringify(obj);
        jsonString += ",\n";
        /*if(ii < unformattedJSON.length - 3){
            jsonString += ",\n"
        }*/
        ii++;
    });
    licensesString = await JSON.stringify(licenseArray);
    jsonString += '{\"usedLicenses\":' + licensesString + "}\n]";
    await fs.writeFileSync(filePath, jsonString);
}

async function bookingJSON(unformattedJSON, filePath) {
    var codBookArray = [];
    console.log("formatter:" + unformattedJSON);
    /*const userJSONF = require('../../JSONs/UserData.json');
    var phoneUsedArray = userJSONF[userJSONF.length - 1]['usedPhones'];
    */
    phoneUsedArray = [];
   
    allUsers = await MongoHandler.executeQuery({}, 'Users');
    allUsers.forEach(element => {
        element.phones.forEach(element2 => {
            phoneUsedArray.push(element2);
        });
    });

    var jsonString = "[\n";
    var ii = 0;
    var obj = new Object();
    for (const element of unformattedJSON) {
        //console.log(ii + ' - ' + unformattedJSON.length)
        if (ii > unformattedJSON.length - 3) break;
  
        var codBook = '';
  
        if (ii % 2 === 0) {

          if (element['__EMPTY_14']) {
            const phoneNumberString = element['__EMPTY_14'];
            //let testNumber = phoneNumberString.replace(" ", "");
            testNumber = phoneNumberString.replace("Telf.:", "");
            const firstNumber = testNumber.split(' ');

            if(firstNumber.length < 6) {
              ii++;
              continue; 
            }
          } else{
            ii++;
            continue; 
          }

          if (element['Fecha :']) {
              codBook = element['Fecha :'].toString();
          } else {
              console.log("Error");
              ii++;
              continue; 
          }
      
          obj = new Object();
      
          if (codBook !== '') {
              obj.codBook = codBook;
              codBookArray.push(codBook);
          } else {
              obj.codBook = "";
          }
      
          var phoneNumbers = [];
          var formattedPhoneNumbers = [];
      
          if (element['__EMPTY_14']) {
            const phoneNumberString = element['__EMPTY_14'];
            const phoneNumberPattern = /(?:(?:\+|00)\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{6,10}/g;
            phoneNumbers = phoneNumberString.match(phoneNumberPattern);
            console.log("THIS:" + phoneNumberString);
            console.log("THIS:" + phoneNumbers);
            formattedPhoneNumbers = phoneNumbers.map(phoneNumber => {
              let formattedNumber = phoneNumber.replace(/^(00|\+)/, ""); // Remove "+" and "00" prefixes
              if (!/^(00|\+)/.test(phoneNumber)) {
                formattedNumber = "34" + formattedNumber; // Add "34" to numbers without "+" or "00" prefix
              }
              return formattedNumber;
            });
          }
      
          if (formattedPhoneNumbers) {
              obj.codClient = await checkForUser(unformattedJSON, formattedPhoneNumbers, ii, codBook);
          } else{
            console.log("just checking");
          }
      
          if (element['__EMPTY_7']) {
              obj.license = element['__EMPTY_7'];
          } else {
              obj.license = "";
          }
      
          if (element['__EMPTY']) {
              const dateObject = XLSX.SSF.parse_date_code(element['__EMPTY']);
              var timeString = '00:00';
              if (element['__EMPTY_1']) {
                timeString = element['__EMPTY_1'];
              }
              obj.deliveryDate = formatDate(dateObject, timeString);
          } else {
              obj.deliveryDate = "";
          }
      
          if (element['__EMPTY_2']) {
              const dateObject = XLSX.SSF.parse_date_code(element['__EMPTY_2']);
              var timeString = '00:00';
              if (element['__EMPTY_3']) {
                timeString = element['__EMPTY_3'];
              }
              obj.returnDate = formatDate(dateObject, timeString);
          } else {
              obj.returnDate = "";
          }
      
          obj.deliveryLocation = "";
            
        } else {
          if (element['__EMPTY']) {
              obj.returnLocation = element['__EMPTY'];
          } else {
              obj.returnLocation = "";
          }
          obj.accesories = "";
          obj.locationCoords = "";
      
          jsonString += JSON.stringify(obj);
          jsonString += ",\n";
        }  
        ii++;
    }
    codBookArray = await JSON.stringify(codBookArray);
    jsonString += '{\"usedBookings\":' + codBookArray + "}\n]";
    await fs.writeFileSync(filePath, jsonString);
}

async function returnJSON(unformattedJSON, filePath) {
  var codBookArray = [];
  var ii = 0;
  var jj = 0;

  var obj = new Object();
  for (const element of unformattedJSON) {
    //console.log(ii + ' - ' + unformattedJSON.length
    if(ii == 0){
    } else{
      const valuesArray = Object.values(element);

      if (ii > unformattedJSON.length - 4) break;
  
      var accesories = [];
      console.log(jj)
      switch(jj){
        case 0:
          obj.codBook = valuesArray[0];
          break;
  
        case 1:
          
          break;
  
        case 2:
          if(valuesArray.length > 1){
            accesories.push(valuesArray[2]);
          }
          break;
  
        default:
          if(valuesArray[0] == 'Sig. Entr: '){
            obj.accesories = accesories;
          } else {
            console.log("test2")
            accesories.push(valuesArray[2]);
          }
          break;
      }

      if(valuesArray[0] == 'Fianzas'){
        jj = 0;
      } else{
        jj++;
      }
  
    }

    ii++;

    const query = { codBook: obj.codBook };
    const updateData = { returnLocation: obj.returnLocation, accesories: obj.accesories };

    const result = await MongoHandler.executeUpdate(query, updateData, "Bookings");
    console.log(result);
  }
}

async function userJSON(unformattedJSON, filePath) {
    var clientPhoneArray = [];
    var jsonString = "[\n";
  
    var obj = new Object();
  
    for (let ii = 0; ii < unformattedJSON.length; ii++) {
        
        console.log(ii + ' - ' + unformattedJSON.length)
        const element = unformattedJSON[ii];
        if (unformattedJSON.length > 3) {
          if (ii > unformattedJSON.length - 3) {
            break;
          }
        }

        if (ii % 2 === 0) {

          if (element['__EMPTY_14']) {
            const phoneNumberString = element['__EMPTY_14'];
            //let testNumber = phoneNumberString.replace(" ", "");
            testNumber = phoneNumberString.replace("Telf.:", "");
            const firstNumber = testNumber.split(' ');

            if(firstNumber.length < 6) {
              ii++; 
              continue; 
            }
          }

          obj = new Object();

          if (element['30/06/2023']) {
            const fullName = element['30/06/2023'];
            const names = fullName.split(' ');
            var firstName = '';
            var surnames = '';

            if (names.length > 3) {
              firstName = names[names.length - 2] + ' ' + names[names.length - 1];
              surnames = fullName.slice(0, -firstName.length).trim();
            } else {
              firstName = names[names.length - 1];
              surnames = fullName.slice(0, -firstName.length).trim();
            }

            obj.name = firstName;
            obj.surname = surnames;
          } else {
            obj.name = "";
            obj.surname = "";
          }

          if (element['__EMPTY_14']) {
            const phoneNumberString = element['__EMPTY_14'];
            const phoneNumberPattern = /(?:(?:\+|00)\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{6,10}/g;
            //const phoneNumberPattern = /(?:(?:\+|00)\d{1,3}\s*)?(?:\(?\d{2,4}\)?\s*)?\d{6,10}/g;
            const phoneNumbers = phoneNumberString.match(phoneNumberPattern);
            const formattedPhoneNumbers = phoneNumbers.map(phoneNumber => {
              let formattedNumber = phoneNumber.replace(/^(00|\+)/, ""); // Remove "+" and "00" prefixes
              if (!/^(00|\+)/.test(phoneNumber)) {
                formattedNumber = "34" + formattedNumber; // Add "34" to numbers without "+" or "00" prefix
              }
              return formattedNumber;
            });

            obj.phones = formattedPhoneNumbers;
            formattedPhoneNumbers.forEach(element => {
              clientPhoneArray.push(element);
            });
          } else {
            obj.phones = "";
          }

          if (element['   F.Salida De 14/08/2017 a 15/08/2017   Ordenado por: Fec+Hora E.']) {
            obj.address = element['__EMPTY_5'];
          } else {
            obj.address = "";
          }
        } else {
          if (element['LISTADO DE ENTREGAS']) {
            const inputString = element['LISTADO DE ENTREGAS'];
            const modifiedString = inputString.replace('#', '@');
            obj.email = modifiedString;
          } else {
            obj.email = "";
          }

          if (element['__EMPTY_5']) {
            obj.bookingAmmount = 0;
          } else {
            obj.bookingAmmount = "";
          }

          if (element['__EMPTY_5']) {
            obj.active = element['__EMPTY_5'];
          } else {
            obj.active = "";
          }

          jsonString += JSON.stringify(obj);
          jsonString += ",\n";
        }
    }
  
    clientPhoneString = JSON.stringify(clientPhoneArray);
    jsonString += '{\"usedPhones\":' + clientPhoneString + '}\n]';
    //fs.writeFile(filePath, jsonString);
    //fs.writeFileSync(filePath, jsonString);
    return jsonString;
}

async function userJSON2(unformattedJSON, filePath, bookCod) {
    var clientPhoneArray = [];
    var jsonString = "[\n";
  
    var obj = new Object();
  
    for (let ii = 0; ii < unformattedJSON.length; ii++) {
        
          console.log(ii + ' - ' + unformattedJSON.length)
        const element = unformattedJSON[ii];
        if (unformattedJSON.length > 3) {
          if (ii > unformattedJSON.length - 3) {
            break;
          }
        }
  
        if (ii % 2 === 0) {
          if (element['__EMPTY_14']) {
            const phoneNumberString = element['__EMPTY_14'];
            //let testNumber = phoneNumberString.replace(" ", "");
            testNumber = phoneNumberString.replace("Telf.:", "");
            const firstNumber = inputString.split(' ');

            if(firstNumber.length < 6) {
              ii++; 
              continue; 
            }
          }
          obj = new Object();

          if (element['30/06/2023']) {
            const fullName = element['30/06/2023'];
            const names = fullName.split(' ');
            var firstName = '';
            var surnames = '';

            if (names.length > 3) {
              firstName = names[names.length - 2] + ' ' + names[names.length - 1];
              surnames = fullName.slice(0, -firstName.length).trim();
            } else {
              firstName = names[names.length - 1];
              surnames = fullName.slice(0, -firstName.length).trim();
            }

            obj.name = firstName;
            obj.surname = surnames;
          } else {
            obj.name = "";
            obj.surname = "";
          }

          if (element['__EMPTY_14']) {
            const phoneNumberString = element['__EMPTY_14'];
            const phoneNumberPattern = /(?:(?:\+|00)\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{6,10}/g;
            const phoneNumbers = phoneNumberString.match(phoneNumberPattern);
            const formattedPhoneNumbers = phoneNumbers.map(phoneNumber => {
              let formattedNumber = phoneNumber.replace(/^(00|\+)/, ""); // Remove "+" and "00" prefixes
              if (!/^(00|\+)/.test(phoneNumber)) {
                formattedNumber = "34" + formattedNumber; // Add "34" to numbers without "+" or "00" prefix
              }
              return formattedNumber;
            });

            obj.phones = formattedPhoneNumbers;
            formattedPhoneNumbers.forEach(element => {
              clientPhoneArray.push(element);
            });
          } else {
            obj.phones = "";
          }

          if (element['   F.Salida De 14/08/2017 a 15/08/2017   Ordenado por: Fec+Hora E.']) {
            obj.address = element['__EMPTY_5'];
          } else {
            obj.address = "";
          }
        } else {
          if (element['LISTADO DE ENTREGAS']) {
            const inputString = element['LISTADO DE ENTREGAS'];
            const modifiedString = inputString.replace('#', '@');
            obj.email = modifiedString;
          } else {
            obj.email = "";
          }

          obj.lastBooking = bookCod;
          obj.bookingAmmount = 1;

          if (element['__EMPTY_5']) {
            obj.active = element['__EMPTY_5'];
          } else {
            obj.active = "";
          }

          jsonString += JSON.stringify(obj);
          jsonString += ",\n";
        }
    }
  
    clientPhoneString = JSON.stringify(clientPhoneArray);
    jsonString += '{\"usedPhones\":' + clientPhoneString + '}\n]';
    //fs.writeFile(filePath, jsonString);
    //fs.writeFileSync(filePath, jsonString);
    return jsonString;
}

function formatDate(dateObject, timeString){
    const [hours, minutes] = timeString.split(':'); // Splitting the time string into hours and minutes

    dateObject.H = parseInt(hours); // Setting the hours of the dateObject
    dateObject.M = parseInt(minutes); // Setting the minutes of the dateObject

    // Constructing the final JavaScript Date object
    const jsDate = new Date(Date.UTC(dateObject.y, dateObject.m - 1, dateObject.d, dateObject.H, dateObject.M));

    // Formatting the date as "YYYY-MM-DD HH:mm"
    const formattedDate = jsDate.toISOString().slice(0, 16).replace('T', ' ');

    return formattedDate;
}

async function checkForUser(unformattedJSON, phoneNumbers, index, codBook){
    codClient = '';
    console.log("userChecked");
    try {
      for (const phoneNumber of phoneNumbers) {
        if (phoneUsedArray.includes(phoneNumber)) {
          console.log("Already exist");
          //const itemId = await MongoHandler.getItemIdByPhone(phoneNumber, 'Users');
          const query = { phones: phoneNumber };
          const item = await MongoHandler.executeQueryFirst(query, 'Users');
          codClient = await item._id; 
        } else {
          console.log("NEW USER");
          var newJSON = await JSON.parse(await JSON.stringify([unformattedJSON[index], unformattedJSON[index+1]]));
          FUserJSON = await userJSON2(newJSON, thisUserJSON, codBook);
          FUserJSON = await JSON.parse(FUserJSON);
          result = await MongoHandler.saveJsonToMongo(FUserJSON, 'Users', true, 'phones', 'usedPhones');
          const query = { phones: phoneNumber };
          const item = await MongoHandler.executeQueryFirst(query, 'Users');
          //await sleep(1000);
          console.log("item");
          console.log(item);
          codClient = item._id;
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
    return codClient;
}

async function saveJsonToFile(jsonData, filePath) {
  // Convert the JSON data to a string
  const jsonString = await JSON.stringify(jsonData, null, 2);

  // Write the JSON string to the file
  await new Promise((resolve, reject) => {
      fs.writeFile(filePath, jsonString, (err) => {
          if (err) reject(err);
          console.log('Saved!');
          resolve();
      });
  });
}

module.exports = {
    vehicleJSON, bookingJSON, userJSON, saveJsonToFile, returnJSON,
};