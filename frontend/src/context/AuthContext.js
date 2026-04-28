import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

// Create the auth context
export const AuthContext = createContext();

const DEFAULT_API_URL =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up axios defaults
  const API_URL = process.env.REACT_APP_API_URL || DEFAULT_API_URL;

  // Setup axios request interceptor to add the token
  useEffect(() => {
    // Add a request interceptor to include auth token
    const interceptor = axios.interceptors.request.use(
      (config) => {
        // Only add the Authorization header if we have a token
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Cleanup - remove the interceptor when component unmounts
    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [token]);

  // Load user if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          setLoading(true);
          // Set auth token in headers
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          // Try to get user from backend to verify token
          const response = await axios.get(`${API_URL}/auth/me`);
          const userData = response.data;

          setUser(userData);
          setIsAuthenticated(true);

          // Update localStorage with fresh user data
          localStorage.setItem("user", JSON.stringify(userData));
        } catch (err) {
          console.error("Error loading user:", err);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken(null);
          setIsAuthenticated(false);
          delete axios.defaults.headers.common["Authorization"];
          setError("Session expired. Please login again.");
        }
        setLoading(false);
      } else {
        delete axios.defaults.headers.common["Authorization"];
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Register a new user
  const register = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      // Make actual API call to backend
      const response = await axios.post(`${API_URL}/auth/register`, userData);

      const { token: authToken, user: newUser } = response.data;

      // Store token and user data
      localStorage.setItem("token", authToken);
      localStorage.setItem("user", JSON.stringify(newUser));

      // Set token in axios headers
      axios.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;

      setToken(authToken);
      setUser(newUser);
      setIsAuthenticated(true);
      setLoading(false);
      return newUser;
    } catch (err) {
      setLoading(false);
      setError(
        err.response?.data?.message || err.message || "Registration failed"
      );
      throw err;
    }
  };

  // Login a user
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      // Make actual API call to backend
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });

      const { token: authToken, user: userData } = response.data;

      // Store token and user data
      localStorage.setItem("token", authToken);
      localStorage.setItem("user", JSON.stringify(userData));

      // Set token in axios headers
      axios.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;

      setToken(authToken);
      setUser(userData);
      setIsAuthenticated(true);
      setLoading(false);
      return userData;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || err.message || "Login failed");
      throw err;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    // Clear axios auth header
    delete axios.defaults.headers.common["Authorization"];
  };

  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  // Special admin login with enhanced security
  const adminLogin = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      // Make actual API call to backend for admin login
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });

      const { token: authToken, user: userData } = response.data;

      // Verify user has admin role
      if (userData.role !== 'admin') {
        setLoading(false);
        setError("Access denied. Admin privileges required.");
        throw new Error("Access denied. Admin privileges required.");
      }

      // Store token and user data
      localStorage.setItem("token", authToken);
      localStorage.setItem("user", JSON.stringify({
        ...userData,
        loginTime: new Date().toISOString(),
        isAdminLogin: true,
      }));

      // Set token in axios headers
      axios.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;

      setToken(authToken);
      setUser({
        ...userData,
        loginTime: new Date().toISOString(),
        isAdminLogin: true,
      });
      setIsAuthenticated(true);
      setLoading(false);

      // Log admin login
      console.info(
        `Admin login successful: ${email} at ${new Date().toISOString()}`
      );

      return userData;
    } catch (err) {
      setLoading(false);
      setError(
        err.response?.data?.message || err.message || "Admin login failed"
      );

      // Log failed attempt
      console.warn(
        `Admin login attempt failed: ${email} at ${new Date().toISOString()}`
      );

      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        error,
        register,
        login,
        adminLogin,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Export context hook for easier use
export const useAuth = () => useContext(AuthContext);
