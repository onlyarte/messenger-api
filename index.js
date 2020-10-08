const config = require('./config');
const { GraphQLServer, PubSub } = require('graphql-yoga');
const mongoose = require('mongoose');
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
    const Authorization = request.get('Authorization');
    const session = Authorization && jwt.verify(
      Authorization.replace('Bearer ', ''),
      config.jwtSecret
    );
    return { request, response, connection, session, pubsub };
  },
  middlewares: [
    (resolve, root, args, context, info) => {
      if (context.session && context.session.userId)
        return resolve(root, args, context, info);
      else throw new Error('Unauthorized');
    },
  ],
});

const options = {
  cors: {
    credentials: true,
    origin: true, // ['http://localhost:3001']
  },
};

server.start(options, () => console.log('Server is running on http://localhost:4000'));
