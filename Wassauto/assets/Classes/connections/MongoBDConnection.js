const { json } = require('express');

const MongoClient = require('mongodb').MongoClient;
const ServerApiVersion = require('mongodb').ServerApiVersion;
// Connection URL
//const dbUrl = 'mongodb://127.0.0.1:27017';
//const dbUrl = 'mongodb://https://dff2-206-204-150-110.ngrok-free.app:27017';
//const dbUrl = 'mongodb://autosplaza:autosplaza1234@autosplaza.macaronesiadigital.com:27017/test';
const dbUrl = 'mongodb+srv://autosplaza:Emiymv9mqFMSl3DQ@cluster0.yszwom4.mongodb.net/?retryWrites=true&w=majority';
// Database Name
const dbName = 'AutosPlazaBBDD';
// Collection Name
//const collectionName = 'Wasssauto';

const { ObjectId } = require('mongodb');

const thisClient = new MongoClient(dbUrl, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const thisClient2 = new MongoClient(dbUrl, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const thisClient3 = new MongoClient(dbUrl, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectToDatabase() {
  console.log("client start");
  try {
      await thisClient.connect(); 
      console.log('Connected to the database');
  } catch (error) {
    console.error('Failed to connect to the database', error);
  }
}

async function disconnectFromDatabase() {
  console.log("client closing");
  try {
      await thisClient.close(); 
      console.log('Disconnected from the database');
  } catch (error) {
    console.error('Failed to disconnect from the database', error);
  }
}

async function executeQuery(query, collectionName) {
  let wasDiscon = false;
  try {
    if(!isConnected){
      await connectToDatabase();
      wasDiscon = true;
    }
    //await connectToDatabase();

    //console.log(query);

    const db = thisClient.db(dbName);
    const collection = db.collection(collectionName);

    return await collection.find(query).toArray();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    if(wasDiscon){
      await disconnectFromDatabase();
    }
    //await disconnectFromDatabase();
  }
}

async function executeQueryFirst(query, collectionName) {
  let wasDiscon = false;
  try {
    if(!isConnected){
      await connectToDatabase();
      wasDiscon = true;
    }
    //await connectToDatabase();

    const db = thisClient.db(dbName);
    const collection = db.collection(collectionName);

    return await collection.findOne(query);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    if(wasDiscon){
      await disconnectFromDatabase();
    }
    //await disconnectFromDatabase();
  }
}

async function executeInsert(document, thisCollectionName, forceID) {
  let wasDiscon = false;
  try {
    if(!isConnected){
      await connectToDatabase();
      wasDiscon = true;
    }
    //await connectToDatabase();
  
    const db = thisClient.db(dbName);
    const collection = db.collection(thisCollectionName);

    forceServerObjectId = forceID;
  
    const existingDoc = await collection.findOne({ _id: document._id });
    if (existingDoc) {
      console.log('Document already exists:', existingDoc);
      const query = { id: new ObjectId(existingDoc._id)}
      await executeUpdate(query, document, thisCollectionName);
      return;
    } else{
      await collection.insertOne(document);
      console.log('Document inserted successfully');
    }

  } catch (error) {
    if (error.code === 11000) {
      console.log('Document with duplicate _id already exists');
      const existingDoc = await collection.findOne({ _id: document._id });
      const query = { id: new ObjectId(existingDoc._id)}
      await executeUpdate(query, document, thisCollectionName);
    } else {
      console.error('Failed to insert document', error);
    }
  } finally {
    if(wasDiscon){
      await disconnectFromDatabase();
    }
    //await disconnectFromDatabase();
  }
}

async function executeUpdate(query, updateData, collectionName) {
  let wasDiscon = false;
  try {
    if(!isConnected){
      await connectToDatabase();
      wasDiscon = true;
    }
    //await connectToDatabase();

    const db = thisClient.db(dbName);
    const collection = db.collection(collectionName);

    // Update a single document that matches the query
    const result = await collection.updateMany(query, { $set: updateData });

    // Use this for updating multiple documents
    // const result = await collection.updateMany(query, { $set: updateData });

    console.log(`${result.modifiedCount} document(s) updated`);

    return result.modifiedCount; // Returns the number of documents updated

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    if(wasDiscon){
      await disconnectFromDatabase();
    }
    //await disconnectFromDatabase();
  }
}

async function executeDelete(query, collectionName) {
  let wasDiscon = false;
  try {
    if(!isConnected){
      await connectToDatabase();
      wasDiscon = true;
    }

      const db = thisClient.db(dbName);
      const collection = db.collection(collectionName);

      return await collection.deleteOne(query);
  } catch (error) {
      console.error('Error:', error);
      throw error;
  } finally {
    if(wasDiscon){
      await disconnectFromDatabase();
    }
  }
}

async function saveJsonToMongo(jsonToSave, collection, checkDup, dupChecker) {
  try{
    var collectionArray = [];
    var dupArray = [];

    allItems = await executeQuery({}, collection);
    allItems.forEach(element => {
      console.log(element[dupChecker]);
      if(Array.isArray(element[dupChecker])) {
        element[dupChecker].forEach(element2 => {
          dupArray.push(element2);
        });
      }else{
        dupArray.push(element[dupChecker]);
      }
    });

    var jj = 0;

    //console.log(jsonToSave);

    for(ii = 0; ii < jsonToSave.length-1; ii++){
      element = jsonToSave[ii];
      
      if(collection === 'Bookings') {
        collectionArray.push(element);
      }

      console.log(ii + ' - ' + (jsonToSave.length - 2));

      if (checkDup) {
        if (Array.isArray(element[dupChecker])) {
          for (const element2 of element[dupChecker]) {
            dupCheck = element2;
            if (dupArray.includes(dupCheck)) {
              console.log(dupCheck + ' already exists in MongoDB');
            } else {
              await executeInsert(element, collection, false);
            }
          }
        } else {
          dupCheck = element[dupChecker];
          if (dupArray.includes(dupCheck)) {
            console.log(dupCheck + ' already exists in MongoDB ' + collection);
          } else {
            await executeInsert(element, collection, false);
          }
        }
      } else {
        await executeInsert(element, collection, false);
      }
    }

    if (collection === 'Bookings') {
      return collectionArray;
    }

  } catch (error) {
    console.error('Failed to insert document', error);
  }
  
}

async function saveJsonToMongo2(jsonToSave, collection, checkDup, dupChecker){
  //var dupArray = jsonToSave[jsonToSave.length-1][arrayToCheck];

  var timesArray = [];

  var dupArray = [];
   
  allItems = await executeQuery({}, collection);
  allItems.forEach(element => {
    if(Array.isArray(element[dupChecker])) {
      element[dupChecker].forEach(element2 => {
        dupArray.push(element2);
      });
    }else{
      dupArray.push(element[dupChecker]);
    }
  });

  var jj = 0;

  jsonToSave.forEach(element => {
      jj+=1;
      if(jj >= jsonToSave.length){
          return;
      }
      console.log(jj + ' - ' + (jsonToSave.length-1));
      if(checkDup){
          if(Array.isArray(element[dupChecker])){
              element[dupChecker].forEach(element2 => {
                  dupCheck = element2;
                  if(dupArray.includes(dupCheck)){
                      console.log(dupCheck + " ya en mongo");
                      return;
                  }else{
                      executeInsert(element, collection, false);
                  }
              });
          } else{
              dupCheck = element[dupChecker];
              if(dupArray.includes(dupCheck)){
                  console.log(dupCheck + " ya en mongo");
                  return;
              }else{
                  executeInsert(element, collection, false);
                  //console.log(element);
                  if(collection === 'Bookings'){
                    const query = { codClient: 'ObjectId(\'' + element.codClient + '\')'};
                    var user = MongoHandler.executeQueryFirst(query, 'Users');
                    var bookingPhone = user.phones[0];
                    //console.log(bookingPhone);
                    //var thisBooking = [element.deliveryDate, element.]
                    timesArray.push(thisTime);
                  }
              }
          }
          
      } else{
          executeInsert(element, collection, false);
          /*console.log(element);
          if(collection === 'Bookings'){
            //thisTime = 
            timesArray.push(thisTime);
          }*/
      }
  });

  if(collection === 'Bookings'){
    return timesArray;
  }
}

function isConnected() {
  return !!thisClient && !!thisClient.topology && thisClient.topology.isConnected()
}

module.exports = {
  isConnected, connectToDatabase, disconnectFromDatabase, executeQuery, executeQueryFirst, executeInsert, executeUpdate, executeDelete, saveJsonToMongo,
};