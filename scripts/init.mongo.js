// TO RUN: mongosh issuetracker scripts/init.mongo.js
//***************************************************/

// Run this script to get a clean start on the database
// specify database in js:  db = db.getSiblingDB('issuetracker')

db.issues.deleteMany({})

let issuesDB = [
  {
    id: 1,
    status: "New",
    owner: "Ravan",
    effort: 5,
    created: new Date("2021-01-15"),
    due: undefined,
    title: "Error in console when clicking Add",
  },
  {
    id: 2,
    status: "Assigned",
    owner: "Eddie",
    effort: 14,
    created: new Date("2021-01-16"),
    due: new Date("2021-02-01"),
    title: "Missing bottom border on panel",
  },
];

db.issues.insertMany(issuesDB);
const count = db.issues.countDocuments();
print('Inserted', count, 'issues');

db.counters.remove({ _id: 'issues' })
db.counters.insert({ _id: 'issues', current: count})

/* MongoDB indexes support efficient data queries. They store portions of the documents so that
  the entire collection is not needed to be scanned for each query */
db.issues.createIndex({ id: 1 }, { unique: true })
db.issues.createIndex({ status: 1 })
db.issues.createIndex({ owner: 1 })
db.issues.createIndex({ created: 1 })