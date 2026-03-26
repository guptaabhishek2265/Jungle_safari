import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  ShoppingCart as SalesIcon,
  AdminPanelSettings as AdminIcon,
  Person as CustomerIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";

const drawerWidth = 240;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const currentUser = user || { role: "customer" };

  const getNavItems = () => {
    const items = [];

    // Everyone can see their role-specific dashboard
    if (currentUser.role === "admin") {
      items.push(
        { text: "Admin Dashboard", icon: <AdminIcon />, path: "/admin" },
        { text: "Inventory", icon: <InventoryIcon />, path: "/inventory" },
        { text: "Sales", icon: <SalesIcon />, path: "/sales" },
        {
          text: "Customer Dashboard",
          icon: <CustomerIcon />,
          path: "/customer",
        }
      );
    } else if (currentUser.role === "inventory_manager") {
      items.push({
        text: "Inventory Dashboard",
        icon: <InventoryIcon />,
        path: "/inventory",
      });
    } else if (currentUser.role === "sales") {
      items.push({
        text: "Sales Dashboard",
        icon: <SalesIcon />,
        path: "/sales",
      });
    } else if (currentUser.role === "customer") {
      items.push({
        text: "Customer Dashboard",
        icon: <CustomerIcon />,
        path: "/customer",
      });
    }

    // Add settings for all users
    items.push({ text: "Settings", icon: <SettingsIcon />, path: "/settings" });

    return items;
  };

  const navItems = getNavItems();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
        },
      }}
    >
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          variant="h6"
          component="div"
          sx={{ fontWeight: "bold", color: "primary.main" }}
        >
          Jungle Safari Store
        </Typography>
      </Box>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
