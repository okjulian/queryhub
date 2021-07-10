const { ApolloServer, gql } = require('apollo-server');

const GraphCMSAPI = require('./datasources/graphcms');

const typeDefs = gql`
  type Product {
    id: ID!
    description: String
    name: String!
    price: Int!
    slug: String!
  }
  type Query {
    products: [Product!]
  }
`;

const resolvers = {
  Query: {
    products: async (parent, args, context) => {
      return await context.dataSources.GraphCMS.getProducts();
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources: () => ({ GraphCMS: new GraphCMSAPI() }),
  introspection: true,
  playground: true,
});

module.exports = server;
