const MongoClient = require('mongodb').MongoClient;
// Connection URL
const dbUrl = 'mongodb://localhost:27017';
// Database Name
const dbName = 'AutosPlazaBBDD';
// Collection Name
//const collectionName = 'Wasssauto';

const client = new MongoClient(dbUrl);

async function connectToDatabase() {
  try {
    await client.connect(); 
    console.log('Connected to the database');
  } catch (error) {
    console.error('Failed to connect to the database', error);
  }
}

async function executeQuery(query, collectionName) {
  thisClient = new MongoClient(dbUrl);

  try {
    await thisClient.connect();

    const db = thisClient.db(dbName);
    const collection = db.collection(collectionName);

    return await collection.find(query).toArray();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    thisClient.close();
  }
}

async function executeQueryFirst(query, collectionName) {
  thisClient = new MongoClient(dbUrl);

  try {
    await thisClient.connect();

    const db = thisClient.db(dbName);
    const collection = db.collection(collectionName);

    return await collection.findOne(query);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    thisClient.close();
  }
}

function executeInsert(document, thisCollectionName, forceID){
  connectToDatabase()
    .then(() => {
      const db = client.db(dbName);
      const collection = db.collection(thisCollectionName);
      
      forceServerObjectId = forceID;

      collection.insertOne(document)
    })
    .then((result) => {
      console.log('Document inserted successfully');
    })
    .catch((error) => {
      console.error('Failed to insert document', error);
    });
}

function saveJsonToMongo(jsonToSave, collection, checkDup, dupChecker, arrayToCheck){
  var dupArray = jsonToSave[jsonToSave.length-1][arrayToCheck];

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
              }
          }
          
      } else{
          executeInsert(element, collection, false);
      }
  });
}

module.exports = {
    executeQuery, executeQueryFirst, executeInsert, saveJsonToMongo,
};