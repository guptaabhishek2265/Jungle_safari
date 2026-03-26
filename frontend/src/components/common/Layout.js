import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Storefront as StoreIcon,
  ShoppingCart as CartIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Groups as GroupsIcon,
  LocalShipping as ShippingIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  Lock as LockIcon,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";

// Width of the drawer
const drawerWidth = 280;

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { user, logout } = useAuth();

  // State for mobile drawer
  const [mobileOpen, setMobileOpen] = useState(false);

  // State for user menu
  const [anchorEl, setAnchorEl] = useState(null);
  const openUserMenu = Boolean(anchorEl);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (
      !token &&
      !location.pathname.includes("/login") &&
      !location.pathname.includes("/register")
    ) {
      navigate("/login");
    }
  }, [navigate, location]);

  // Handle mobile drawer toggle
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Handle opening user menu
  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle closing user menu
  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Generate navigation links based on user role
  const getNavLinks = () => {
    if (!user) return [];

    const links = [];

    // Admin links
    if (user.role === "admin") {
      links.push(
        {
          text: "Admin Dashboard",
          icon: <DashboardIcon />,
          path: "/admin/dashboard",
        },
        { text: "User Management", icon: <GroupsIcon />, path: "/admin/users" },
        { text: "Divider" },
        {
          text: "Inventory Dashboard",
          icon: <InventoryIcon />,
          path: "/inventory/dashboard",
        },
        {
          text: "Suppliers",
          icon: <BusinessIcon />,
          path: "/inventory/suppliers",
        },
        {
          text: "Purchase Orders",
          icon: <ShippingIcon />,
          path: "/inventory/purchase-orders",
        },
        {
          text: "Low Stock Alerts",
          icon: <WarningIcon />,
          path: "/inventory/low-stock",
        },
        { text: "Divider" },
        {
          text: "Sales Dashboard",
          icon: <CartIcon />,
          path: "/sales/dashboard",
        },
        {
          text: "Customer Dashboard",
          icon: <PersonIcon />,
          path: "/customer",
        }
      );
    }

    // Sales role links
    if (user.role === "sales") {
      links.push(
        {
          text: "Sales Dashboard",
          icon: <DashboardIcon />,
          path: "/sales/dashboard",
        },
        {
          text: "Customer Dashboard",
          icon: <PersonIcon />,
          path: "/customer",
        }
      );
    }

    // Inventory Manager links
    if (user.role === "inventory_manager") {
      links.push(
        {
          text: "Inventory Dashboard",
          icon: <DashboardIcon />,
          path: "/inventory/dashboard",
        },
        {
          text: "Suppliers",
          icon: <BusinessIcon />,
          path: "/inventory/suppliers",
        },
        {
          text: "Purchase Orders",
          icon: <ShippingIcon />,
          path: "/inventory/purchase-orders",
        },
        {
          text: "Low Stock Alerts",
          icon: <WarningIcon />,
          path: "/inventory/low-stock",
        }
      );
    }

    // Customer role links
    if (user.role === "customer") {
      links.push(
        {
          text: "Customer Dashboard",
          icon: <DashboardIcon />,
          path: "/customer",
        },
        {
          text: "Products",
          icon: <StoreIcon />,
          path: "/customer/products",
        },
        {
          text: "My Orders",
          icon: <CartIcon />,
          path: "/customer/orders",
        }
      );
    }

    return links;
  };

  // Drawer content
  const drawer = (
    <div>
      <Toolbar>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ fontWeight: "bold" }}
        >
          Jungle Safari
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {getNavLinks().map((item, index) =>
          item.text === "Divider" ? (
            <Divider key={`divider-${index}`} sx={{ my: 1 }} />
          ) : (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                onClick={() => {
                  if (isMobile) {
                    handleDrawerToggle();
                  }
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          )
        )}
      </List>
    </div>
  );

  // Don't render layout for login and register pages
  if (
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/" ||
    location.pathname === "/admin/login"
  ) {
    return <Outlet />;
  }

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* App Bar */}
      <AppBar
        position="fixed"
        className={
          location.pathname.includes("inventory")
            ? "inventory-manager-panel"
            : ""
        }
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Page title - could be dynamic based on route */}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {location.pathname.includes("admin") && "Admin Panel"}
            {location.pathname.includes("sales") && "Sales Management"}
            {location.pathname.includes("inventory") &&
              "Inventory_manager Panel"}
          </Typography>

          {/* User menu */}
          {user && (
            <>
              <IconButton
                onClick={handleUserMenuOpen}
                aria-controls={openUserMenu ? "user-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={openUserMenu ? "true" : undefined}
                color="inherit"
              >
                <Avatar sx={{ bgcolor: "secondary.main" }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </Avatar>
              </IconButton>
              <Menu
                id="user-menu"
                anchorEl={anchorEl}
                open={openUserMenu}
                onClose={handleUserMenuClose}
                MenuListProps={{
                  "aria-labelledby": "user-button",
                }}
              >
                <MenuItem disabled>
                  <Typography variant="body2">
                    Signed in as <b>{user.name}</b>
                  </Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleUserMenuClose}>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  Profile
                </MenuItem>
                <MenuItem onClick={handleUserMenuClose}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  Settings
                </MenuItem>
                <Divider />
                {!user.isAdminLogin && user.role === "admin" && (
                  <MenuItem
                    component={Link}
                    to="/admin/login"
                    onClick={handleUserMenuClose}
                  >
                    <ListItemIcon>
                      <LockIcon fontSize="small" color="warning" />
                    </ListItemIcon>
                    <Typography color="warning.main">
                      Admin Secure Login
                    </Typography>
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: "100vh",
          background: "#f5f5f5",
        }}
      >
        <Toolbar /> {/* This provides spacing below the app bar */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
