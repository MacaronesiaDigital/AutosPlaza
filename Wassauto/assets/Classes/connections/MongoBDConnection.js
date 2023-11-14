const { json } = require('express');

const MongoClient = require('mongodb').MongoClient;
const ServerApiVersion = require('mongodb').ServerApiVersion;
// Connection URL
const dbUrl = 'mongodb://127.0.0.1:27017';
//const dbUrl = 'mongodb://https://dff2-206-204-150-110.ngrok-free.app:27017';
//const dbUrl = 'mongodb://autosplaza:autosplaza1234@autosplaza.macaronesiadigital.com:27017/test';
//const dbUrl = 'mongodb+srv://autosplaza:Emiymv9mqFMSl3DQ@cluster0.yszwom4.mongodb.net/?retryWrites=true&w=majority';
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

const ClientTemplate = new MongoClient(dbUrl, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function newClient(){
  const newClient = ClientTemplate;
  return newClient;
}

async function connectNewClient(client){
  try {
    await client.connect();
    console.log('Connected to the database');
  } catch (error) {
    console.error('Failed to connect to the database', error);
  }
}

async function disconnectNewClient(client){
  try {
    client.close(); 
    console.log('Disconnected from the database');
  } catch (error) {
    console.error('Failed to disconnect from the database', error);
  }
}

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

async function executeQueryNC(query, collectionName) {
  const nClient = await newClient();
  try {

    await connectNewClient(nClient);

    const db = nClient.db(dbName);
    const collection = db.collection(collectionName);

    return await collection.find(query).toArray();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    disconnectNewClient(nClient);
  }
}

async function executeQueryFirst(query, collectionName) {
  let wasDiscon = false;
  try {
    if(!isConnected){
      await connectToDatabase();
      wasDiscon = true;
    }

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
  }
}

async function executeQueryFirstNC(query, collectionName) {
  const nClient = await newClient();
  console.log(nClient)
  try {
    await connectNewClient(nClient);
    const db = await nClient.db(dbName);
    const collection = await db.collection(collectionName);
    console.log(query)
    console.log(await collection.findOne(query))
    return await collection.findOne(query);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    //disconnectNewClient(nClient);
  }
}

async function executeInsert(document, thisCollectionName, forceID) {
  let wasDiscon = false;
  try {
    if(!isConnected){
      await connectToDatabase();
      wasDiscon = true;
    }
  
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
  }
}

async function executeInsertNC(document, thisCollectionName, forceID) {
  const nClient = await newClient();
  try {
    
    await connectNewClient(nClient);

    const db = nClient.db(dbName);
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
    disconnectNewClient(nClient);
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

async function executeUpdateNC(query, updateData, collectionName) {
  const nClient = await newClient();
  try {
    
    await connectNewClient(nClient);

    const db = nClient.db(dbName);
    const collection = db.collection(collectionName);

    // Update a single document that matches the query
    const result = await collection.updateMany(query, { $set: updateData });

    console.log(`${result.modifiedCount} document(s) updated`);

    return result.modifiedCount; // Returns the number of documents updated

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    disconnectNewClient(nClient);
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

async function executeDeleteNC(query, collectionName) {
  const nClient = await newClient();
  try {
    
    await connectNewClient(nClient);

    const db = nClient.db(dbName);
    const collection = db.collection(collectionName);

    return await collection.deleteOne(query);
  } catch (error) {
      console.error('Error:', error);
      throw error;
  } finally {
    disconnectNewClient(nClient);
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
            const dupCheck = element2;
            if (dupArray.includes(dupCheck)) {
              console.log(dupCheck + ' already exists in MongoDB');
              let query = {  }
              switch(collection){
                case "Bookings":
                  query = { codBook: dupCheck };
                break;

                case "Users":
                  query = { phones: dupCheck };
                break;

                case "Flota":
                  query = { license: dupCheck };
                break;
              }
              await executeUpdate(query, element, collection);
            } else {
              await executeInsert(element, collection, false);
            }
          }
        } else {
          const dupCheck = element[dupChecker];
          if (dupArray.includes(dupCheck)) {
            console.log(dupCheck + ' already exists in MongoDB ' + collection);
            let query = {  }
              switch(collection){
                case "Bookings":
                  query = { codBook: dupCheck };
                break;

                case "Users":
                  query = { phones: dupCheck };
                break;

                case "Flota":
                  query = { license: dupCheck };
                break;
              }

              console.log(element);

              await executeUpdate(query, element, collection);
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

function isConnected() {
  return !!thisClient && !!thisClient.topology && thisClient.topology.isConnected()
}

module.exports = {
  isConnected, connectToDatabase, disconnectFromDatabase,
  executeQuery, executeQueryFirst, executeInsert, executeUpdate, executeDelete, 
  executeQueryNC, executeQueryFirstNC, executeInsertNC, executeUpdateNC, executeDeleteNC, 
  saveJsonToMongo,
};