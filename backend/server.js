const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const eventEmitter = require("./utils/eventEmitter");
const connectToDatabase = require("./utils/connectToDatabase");

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const server = http.createServer(app);
const isAllowedVercelOrigin = (origin = "") =>
  /^https:\/\/jungle-safari(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(origin);

const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://jungle-safari-souvenir-shop-o67c.vercel.app"
      ];

      if (
        !origin ||
        allowedOrigins.indexOf(origin) !== -1 ||
        isAllowedVercelOrigin(origin) ||
        process.env.NODE_ENV === "development"
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("New client connected");

  // Listen for client joining specific rooms
  socket.on("join", (rooms) => {
    if (Array.isArray(rooms)) {
      rooms.forEach((room) => socket.join(room));
    } else if (typeof rooms === "string") {
      socket.join(rooms);
    }
    console.log(
      `Client joined rooms: ${Array.isArray(rooms) ? rooms.join(", ") : rooms}`
    );
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Setup event listeners for inventory updates
eventEmitter.on("stockUpdated", (data) => {
  io.to("inventory").emit("stockUpdated", data);
  console.log("Stock update event emitted:", data);
});

eventEmitter.on("lowStock", (data) => {
  io.to("inventory").emit("lowStock", data);
  io.to("admin").emit("lowStock", data);
  console.log("Low stock alert emitted:", data);
});

// Middleware
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://jungle-safari-souvenir-shop-o67c.vercel.app",
  "https://jungle-safari-ma1d.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    // Allow deployed Jungle Safari frontends on Vercel
    if (isAllowedVercelOrigin(origin)) {
      return callback(null, true);
    }

    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const productRoutes = require("./routes/products");
const salesRoutes = require("./routes/sales");
const inventoryRoutes = require("./routes/inventory");
const suppliersRoutes = require("./routes/suppliers");
const purchaseOrderRoutes = require("./routes/purchaseOrders");
const ordersRoutes = require("./routes/orders");

app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    res.status(500).json({
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/suppliers", suppliersRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/orders", ordersRoutes);

// Welcome route
app.get("/", (req, res) => {
  res.send("Welcome to Jungle Safari Inventory Management API");
});

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express.static("client/build"));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

const PORT = process.env.PORT || 5000;
const isVercel = Boolean(process.env.VERCEL);

if (!isVercel) {
  connectToDatabase()
    .then(() => {
      server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error("Failed to connect to MongoDB", err);
    });
}

module.exports = app;
