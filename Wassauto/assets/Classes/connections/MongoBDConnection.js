const MongoClient = require('mongodb').MongoClient;
// Connection URL
const dbUrl = 'mongodb://localhost:27017';
// Database Name
const dbName = 'AutosPlazaBBDD';
// Collection Name
const collectionName = 'Wasssauto';

const client = new MongoClient(dbUrl);

async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connected to the database');
  } catch (error) {
    console.error('Failed to connect to the database', error);
  }
}

function executeQuery(query) {
  return new Promise((resolve, reject) => {
    connectToDatabase() // Call the connectToDatabase function to establish the connection
      .then(() => {
        // Access the specified database and collection
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Execute the query
        return collection.find(query).toArray();
      })
      .then((result) => {
        // Close the connection
        client.close();

        resolve(result);
      })
      .catch((error) => {
        console.error('Error executing query:', error);
        reject(error);
      });
  });
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

module.exports = {
    executeQuery, executeInsert
};