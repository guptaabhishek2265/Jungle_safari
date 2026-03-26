const mongoose = require("mongoose");

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://test-yt:2QLGZiCAG0mkLhRS@cluster0.qyubw.mongodb.net/jungle_safari_inventory";

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
    .connect(MONGO_URI)
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
