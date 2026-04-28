import axios from "axios";

const defaultApiUrl =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000";
const rawApiUrl = process.env.REACT_APP_API_URL || defaultApiUrl;
const normalizedBaseUrl = rawApiUrl.replace(/\/api\/?$/, "");

// Create an instance of axios with default config
const api = axios.create({
  baseURL: normalizedBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include authentication token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common error cases
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle session expiration or unauthorized access
    if (error.response && error.response.status === 401) {
      const responseMessage =
        error.response.data?.message || error.response.data?.msg || "";
      const isAuthFailure =
        error.config?.url?.includes("/auth/me") ||
        /not authorized, no token|not authorized, user not found|not authorized, token invalid|account is disabled/i.test(
          responseMessage
        );

      if (isAuthFailure) {
        // Clear saved auth state only when the session/token is actually invalid
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }

    // Handle server errors with a more specific message
    if (error.response && error.response.status >= 500) {
      console.error("Server error occurred:", error.response.data);
    }

    return Promise.reject(error);
  }
);

export default api;
