const fs = require("fs");
const express = require("express");
const { ApolloServer, UserInputError } = require("apollo-server-express");
const { GraphQLScalarType } = require("graphql");
const { Kind } = require("graphql/language");
const { MongoClient } = require("mongodb");

const url = "mongodb://localhost/issuetracker"

let db;

const GraphQLDate = new GraphQLScalarType({
  name: "GraphQLDate",
  description: "A Date() type in GraphQL as a scalar",
  serialize(value) {
    // turns value into a standard string format
    return value.toISOString();
  },
  parseValue(value) {
    const dateValue = new Date(value);
    return isNaN(dateValue) ? undefined : dateValue;
  },
  parseLiteral(ast) {
    if (ast.kind == Kind.STRING) {
      const value = new Date(ast.value);
      return isNaN(value) ? undefined : value;
    }
  },
});

let aboutMessage = "Issue Tracker API v1.0";

const setAboutMessage = (_, { message }) => {
  return (aboutMessage = message);
};

const issueValidate = (issue) => {
  const errors = [];
  if (issue.title.length < 3) {
    errors.push('Field "title" must be at least 3 characters long.');
  }
  if (issue.status === "Assigned" && !issue.owner) {
    errors.push('Field "owner" is required when status is "Assigned".');
  }
  if (errors.length > 0) {
    throw new UserInputError("Invalid input(s)", { errors });
  }
};

const getNextSequence = async (name) => {
  const result = await db.collection('counters').findOneAndUpdate(
    { _id: name },
    { $inc: { current: 1 } },
    { returnOriginal: false },
  );
  return result.value.current;
}

const issueAdd = async (_, { issue }) => {
  issueValidate(issue);
  issue.created = new Date();

  issue.id = await getNextSequence('issues')

  const result = await db.collection('issues').insertOne(issue)

  const savedIssue = await db.collection('issues')
    .findOne({ _id: result.insertedId })

  return savedIssue
};

const issueList = async () => {
  const issues = await db.collection('issues').find({}).toArray();
  return issues;
};

const connectToDb = async () => {
  const client = new MongoClient(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  await client.connect();
  console.log('Connected to MongoDB at', url)
  db = client.db();
}

const resolvers = {
  Query: {
    about: () => aboutMessage,
    issueList,
  },
  Mutation: {
    setAboutMessage,
    issueAdd,
  },
  GraphQLDate,
};

const server = new ApolloServer({
  typeDefs: fs.readFileSync("schema.graphql", "utf-8"),
  resolvers,
  formatError: (error) => {
    console.log(error);
    return error;
  },
});

// Instantiate server. require(arg) is allowed to return any data type that can be stored as a var.
//  In this case, a function is stored for instantiating a server
const app = express();

// Apollo server has lots of middleware. Server has method to mount all at once.
server.applyMiddleware({ app, path: "/graphql" });

(async function () {
  try {
    await connectToDb();
    app.listen(3001, () => {
      console.log('API server started on port 3001')
    })
  } catch (err) {
    console.log("ERROR:", err);
  }
})();

