let issues = db.collection.issues.find({}).toArray()

console.log(issues)