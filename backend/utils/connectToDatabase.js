const mongoose = require("mongoose");

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://abhishek23102_db_user:Mummy1234@cluster0.eynubcv.mongodb.net/jungle_safari_inventory?appName=Cluster0";

let cachedConnection = null;
let connectingPromise = null;

async function connectToDatabase() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  if (connectingPromise) {
    return connectingPromise;
  }

  connectingPromise = mongoose
    .connect(MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
    })
    .then((connection) => {
      cachedConnection = connection;
      console.log("Connected to MongoDB");
      return connection;
    })
    .catch((error) => {
      cachedConnection = null;
      throw error;
    })
    .finally(() => {
      connectingPromise = null;
    });

  return connectingPromise;
}

module.exports = connectToDatabase;
