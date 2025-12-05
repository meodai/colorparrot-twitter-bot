const { PrismaClient } = require("@prisma/client");

let prisma = null;

const connect = async () => {
  if (!prisma) {
    prisma = new PrismaClient();
    await prisma.$connect();
  }
  return prisma;
};

const disconnect = async () => {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
};

const getClient = () => prisma;

// Model-like interface to maintain compatibility with existing code
const models = {
  request: {
    create: async (data) => {
      const client = getClient();
      return client.request.create({
        data: {
          tweetId: data.tweet_id,
          resolved: data.resolved || false,
          failed: data.failed || false,
        },
      });
    },
    updateOne: async (filter, update) => {
      const client = getClient();
      // Handle MongoDB-style _id filter
      const id = filter._id || filter.id;
      return client.request.update({
        where: { id },
        data: {
          resolved: update.resolved,
          failed: update.failed,
        },
      });
    },
    find: async (filter) => {
      const client = getClient();
      return client.request.findMany({
        where: {
          resolved: filter.resolved,
          failed: filter.failed,
        },
      });
    },
  },
};

module.exports = {
  connect,
  disconnect,
  models,
  getClient,
};
