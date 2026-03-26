# Jungle Safari Souvenir Shop - Inventory Management System

A comprehensive inventory management system for the Jungle Safari Souvenir Shop, built with React.js frontend and Node.js/Express backend.

## 🚀 Features

- **Inventory Management**: Track products, stock levels, and categories
- **Real-time Updates**: Live inventory monitoring with Socket.IO
- **User Authentication**: Role-based access control (Admin, Inventory Manager, Employee)
- **Sales Management**: Process sales and track revenue
- **Supplier Management**: Manage supplier information and relationships
- **Purchase Orders**: Create and manage purchase orders
- **Low Stock Alerts**: Automated notifications for low stock items
- **Auto-reorder System**: Configurable automatic reordering
- **Dashboard Analytics**: Visual insights into inventory and sales data

## 🛠️ Tech Stack

### Frontend
- React.js 18
- Material-UI (MUI)
- Framer Motion (animations)
- ApexCharts (data visualization)
- Axios (HTTP client)
- React Router (navigation)

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Socket.IO (real-time updates)
- bcryptjs (password hashing)

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account or local MongoDB installation
- Git

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/guptaabhishek2265/Jungle_safari.git
cd Jungle_safari
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your configuration
# MONGO_URI=your_mongodb_connection_string
# JWT_SECRET=your_jwt_secret
# PORT=5000
# NODE_ENV=development
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from root)
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file
# REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Database Setup

The application will automatically create the necessary collections. To create an admin user, run:

```bash
# From backend directory
node scripts/createAdminUser.js
```

## 🚀 Running the Application

### Development Mode

1. **Start Backend Server**:
```bash
cd backend
npm run dev
```

2. **Start Frontend Development Server**:
```bash
cd frontend
npm start
```

3. **Access the Application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Production Mode

```bash
# Build frontend
cd frontend
npm run build

# Start backend in production
cd backend
npm start
```

## 📁 Project Structure

```
Jungle_safari/
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── utils/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── styles/
│   │   └── utils/
│   ├── .env.example
│   └── package.json
├── .gitignore
├── README.md
└── package.json
```

## 🔐 Default Login Credentials

After running the admin user creation script:

- **Email**: admin@junglesafari.com
- **Password**: admin123
- **Role**: Admin

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Inventory
- `GET /api/inventory` - Get inventory data
- `PUT /api/inventory/:id` - Update stock levels

### Sales
- `GET /api/sales` - Get sales data
- `POST /api/sales` - Create sale

## 🚀 Deployment

### Vercel Deployment

1. **Prepare for Deployment**:
   - Ensure all environment variables are set
   - Build the frontend: `cd frontend && npm run build`

2. **Deploy Backend**:
   - Create a new Vercel project for backend
   - Set environment variables in Vercel dashboard
   - Deploy from `backend` directory

3. **Deploy Frontend**:
   - Create a new Vercel project for frontend
   - Set `REACT_APP_API_URL` to your backend URL
   - Deploy from `frontend` directory

### Environment Variables for Production

**Backend (.env)**:
```
MONGO_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
PORT=5000
NODE_ENV=production
```

**Frontend (.env.production)**:
```
REACT_APP_API_URL=https://your-backend-url.vercel.app/api
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Abhishek Gupta** - *Initial work* - [guptaabhishek2265](https://github.com/guptaabhishek2265)

## 🙏 Acknowledgments

- Material-UI for the beautiful component library
- MongoDB for the robust database solution
- Vercel for hosting and deployment platform

## 📞 Support

If you have any questions or need help with setup, please create an issue in the GitHub repository.

---

**Happy Coding! 🎉**