const config = require('./config');
const { GraphQLServer, PubSub } = require('graphql-yoga');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const resolvers = require('./resolvers');

mongoose
  .connect(config.dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((error) => console.log(error));

const pubsub = new PubSub();

const server = new GraphQLServer({
  typeDefs: './schema.graphql',
  resolvers,
  context: async ({ request, response, connection }) => {
    const authorization =
      (request && request.headers.authorization) ||
      (connection && connection.context.Authorization);
    const token = authorization && authorization.replace('Bearer ', '');
    const session = token && jwt.verify(token, config.jwtSecret);
    return { request, response, connection, session, pubsub };
  },
  // middlewares: [
  //   (resolve, root, args, context, info) => {
  //     // Require authorization for all requests
  //     if (context.session && context.session.userId)
  //       return resolve(root, args, context, info);
  //     else throw new Error('Unauthorized');
  //   },
  // ],
});

const options = {
  cors: {
    credentials: true,
    origin: true, // ['http://localhost:3001']
  },
};

server.start(options, () => console.log('Server is running on http://localhost:4000'));
