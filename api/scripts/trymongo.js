const { MongoClient } = require("mongodb");

const url = "mongodb://localhost/issuetracker";

const testWithAsync = async () => {
  console.log('\n --- testWithAwait --- \n')
  const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
  
  try {
    // connect to db server
    await client.connect()
    console.log('Connected to MongoDB')

    // connect to db
    const db = client.db()

    // get collection handler/cursor
    const collection = db.collection('employees')
  
    // create new doc
    const employee = { id: 1, name: 'B. Async', age: 33 }
    const result = await collection.insertOne(employee)
    console.log('\n Result of Insert:\n', result.insertedId)
  
    const doc = await collection.find({ _id: result.insertedId })
      .toArray()
    console.log('\n Result of Find:\n', doc)
  } catch(err) {
    console.log(err)
  } finally {
    client.close()
  }
}

const testWithCallBacks = (callback) => {
  console.log("\n--- testWithCallBacks ---");

  const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

  // Connects to the database server. Calling 'db' method of 'client' arg connects to database
  client.connect((err, client) => {
    if (err) {
      callback(err);
      return;
    }
    console.log("Connected to MongoDB");

    // Connect to database
    const db = client.db();

    // Like creating a cursor in mongosh. A handle.
    const collection = db.collection("employees");

    // Add employee data to collection
    const employee = { id: 2, name: "A. Callback", age: 12 };
    // Insert operation only possible in callback of connection operation. Only then is 
    //    there a connection.
    collection.insertOne(employee, (err, result) => {
      if (err) {
        client.close();
        callback(err);
        return;
      }
      // 'result' is a large object. Print the entire thing to see for yourself.
      console.log("Result of insert:\n", result.insertedId);
      collection.find({ _id: result.insertedId }).toArray((err, docs) => {
        if (err) {
          client.close()
          callback(err)
          return
        }

        console.log("Result of find:\n", docs);
        client.close();
        callback(err)
      });
    });
  });
};

testWithCallBacks((err) => {
  if (err) {
    console.log(err);
  }
  testWithAsync()
});
