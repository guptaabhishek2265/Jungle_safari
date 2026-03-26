import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  AdminPanelSettings,
  LockPerson,
  Security,
} from "@mui/icons-material";
import { AuthContext } from "../../context/AuthContext";
import { keyframes } from "@mui/system";

// Animation keyframes
const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
`;

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [ipAddress, setIpAddress] = useState("");

  const { adminLogin, isAuthenticated, loading, user, error } =
    useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (isAuthenticated && user && user.role === "admin") {
      navigate("/admin");
    }
  }, [isAuthenticated, user, navigate]);

  // Set form error if auth error exists
  useEffect(() => {
    if (error) {
      setFormError(error);
    }
  }, [error]);

  // Get client IP (for demo purposes - in a real app, this would be handled by the backend)
  useEffect(() => {
    const getIpAddress = async () => {
      try {
        // This is just for demonstration - in production, IP would be detected server-side
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        setIpAddress(data.ip);
      } catch (err) {
        console.error("Could not fetch IP address", err);
        setIpAddress("Unknown");
      }
    };

    getIpAddress();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) return;

    setFormError("");

    // Rate limiting for security
    if (attempts >= 5) {
      setFormError("Too many login attempts. Please try again later.");
      return;
    }

    try {
      // Check for the specific admin credentials first
      if (email === "abhishek2265@gmail.com" && password === "654321") {
        // Call the adminLogin function from the context
        const user = await adminLogin(email, password);

        // Add success feedback
        console.log("Admin login successful:", user);

        // Navigate to admin dashboard after successful login
        navigate("/admin");
      } else {
        setAttempts((prev) => prev + 1);
        throw new Error("Invalid admin credentials");
      }
    } catch (err) {
      console.error("Login error:", err);

      // Log security event
      console.warn(`Admin login attempt from IP: ${ipAddress}`);

      setFormError(
        err.message ||
          err.response?.data?.message ||
          "Login failed. Please try again."
      );
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: "url('/images/img8.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(3px)",
        },
      }}
    >
      <Container
        component="main"
        maxWidth="xs"
        sx={{ position: "relative", zIndex: 2 }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -80,
            left: "50%",
            transform: "translateX(-50%)",
            width: 100,
            height: 100,
            borderRadius: "50%",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            animation: `${pulse} 2s infinite ease-in-out`,
            boxShadow: "0 0 20px rgba(255, 255, 255, 0.3)",
          }}
        >
          <AdminPanelSettings sx={{ fontSize: 60, color: "#fff" }} />
        </Box>

        <Paper
          elevation={6}
          sx={{
            padding: 4,
            paddingTop: 5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            backgroundColor: "rgba(10, 25, 41, 0.9)",
            backdropFilter: "blur(10px)",
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            color: "#fff",
            marginTop: 8,
            border: "1px solid rgba(81, 81, 81, 0.3)",
          }}
        >
          <Typography
            component="h1"
            variant="h5"
            sx={{
              mb: 1,
              fontWeight: "bold",
              textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
              color: "#64FFDA",
            }}
          >
            Admin Access Only
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              mb: 3,
              justifyContent: "center",
            }}
          >
            <LockPerson sx={{ color: "rgba(255, 255, 255, 0.7)", mr: 1 }} />
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255, 255, 255, 0.7)",
              }}
            >
              Restricted Area • Authorized Personnel Only
            </Typography>
          </Box>

          {formError && (
            <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
              {formError}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ mt: 1, width: "100%" }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Admin Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.7)",
                },
                "& .MuiOutlinedInput-input": {
                  color: "#fff",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255, 255, 255, 0.2)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255, 255, 255, 0.3)",
                },
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Admin Password"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.7)",
                },
                "& .MuiOutlinedInput-input": {
                  color: "#fff",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255, 255, 255, 0.2)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255, 255, 255, 0.3)",
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={toggleShowPassword}
                      edge="end"
                      sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                backgroundColor: "#64FFDA",
                color: "#0A1929",
                fontWeight: "bold",
                "&:hover": {
                  backgroundColor: "#76d7c4",
                },
                position: "relative",
                overflow: "hidden",
              }}
            >
              {loading ? <CircularProgress size={24} /> : "Secure Login"}
            </Button>

            <Divider sx={{ my: 2, borderColor: "rgba(255, 255, 255, 0.1)" }} />

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Security
                sx={{ fontSize: 16, color: "rgba(255, 255, 255, 0.5)", mr: 1 }}
              />
              <Typography
                variant="caption"
                sx={{ color: "rgba(255, 255, 255, 0.5)", textAlign: "center" }}
              >
                Secured login • IP: {ipAddress || "..."}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default AdminLogin;
