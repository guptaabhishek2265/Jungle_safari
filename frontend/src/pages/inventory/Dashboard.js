import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Grid,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Container,
  alpha,
} from "@mui/material";
import {
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Warning as WarningIcon,
  Save as SaveIcon,
  LocalShipping as SupplierIcon,
  ShoppingCart as PurchaseOrderIcon,
  Add as AddIcon,
  Store as StoreIcon,
  People as PeopleIcon,
  InsertChart as ChartIcon,
  Autorenew as AutorenewIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";

// Import inventory-related components
import StockTable from "../../components/inventory/StockTable";
import LowStockAlert from "../../components/inventory/LowStockAlert";
import StatsCard from "../../components/dashboard/StatsCard";
import RealTimeInventoryMonitor from "../../components/inventory/RealTimeInventoryMonitor";
import DashboardLayout from "../../components/common/DashboardLayout";
import SupplierManagement from "./SupplierManagement";
import PurchaseOrderManagement from "./PurchaseOrderManagement";
import AutoReorderSettings from "../../components/inventory/AutoReorderSettings";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

// Create inventory context for real-time updates
export const InventoryContext = React.createContext();

// Particle animation component for cool background effects
const ParticleAnimation = () => {
  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: Math.random() * 100 + "%",
            y: Math.random() * 100 + "%",
            scale: Math.random() * 0.5 + 0.5,
            opacity: Math.random() * 0.3 + 0.1,
          }}
          animate={{
            x: [
              Math.random() * 100 + "%",
              Math.random() * 100 + "%",
              Math.random() * 100 + "%",
              Math.random() * 100 + "%",
            ],
            y: [
              Math.random() * 100 + "%",
              Math.random() * 100 + "%",
              Math.random() * 100 + "%",
              Math.random() * 100 + "%",
            ],
            opacity: [
              Math.random() * 0.3 + 0.1,
              Math.random() * 0.5 + 0.2,
              Math.random() * 0.3 + 0.1,
            ],
          }}
          transition={{
            duration: 20 + Math.random() * 30,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.1)",
            boxShadow: "0 0 20px rgba(255, 255, 255, 0.2)",
            width: 20 + Math.random() * 50 + "px",
            height: 20 + Math.random() * 50 + "px",
          }}
        />
      ))}
    </Box>
  );
};

// Interactive background with img8.webp
const InteractiveBackground = ({ children }) => {
  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        "&::before": {
          content: '""',
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: "url('/images/img8.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          filter: "brightness(0.5) contrast(1.1) saturate(1.2)",
          zIndex: -2,
        },
        "&::after": {
          content: '""',
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "linear-gradient(135deg, rgba(0,20,40,0.8) 0%, rgba(0,60,30,0.7) 100%)",
          zIndex: -1,
        },
      }}
    >
      <ParticleAnimation />
      {children}
    </Box>
  );
};

const getLowStockProducts = (items, enabled, threshold) =>
  items.filter((product) =>
    enabled ? product.stock <= threshold : product.stock <= product.reorderLevel
  );

const buildStats = (items, enabled, threshold) => {
  const lowStock = getLowStockProducts(items, enabled, threshold);
  return {
    totalProducts: items.length,
    totalStock: items.reduce((sum, item) => sum + Number(item.stock || 0), 0),
    lowStockItems: lowStock.length,
  };
};

const mergeNotifications = (items, enabled, threshold, previous = []) => {
  const previousByProduct = new Map(
    previous.map((notification) => [notification.productId, notification])
  );

  return getLowStockProducts(items, enabled, threshold).map((product) => {
    const existing = previousByProduct.get(product.id);
    return {
      id: existing?.id || `reorder-${product.id}`,
      productId: product.id,
      productName: product.name,
      currentStock: product.stock,
      reorderLevel: enabled ? threshold : product.reorderLevel,
      reorderQuantity: Math.max(
        (enabled ? threshold : product.reorderLevel) - product.stock + 10,
        5
      ),
      timestamp: existing?.timestamp || new Date().toISOString(),
      status: existing?.status || "pending",
    };
  });
};

// Create a provider component
export const InventoryProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    lowStockItems: 0,
  });
  const [autoReorderEnabled, setAutoReorderEnabled] = useState(false);
  const [autoReorderThreshold, setAutoReorderThreshold] = useState(5);
  const [reorderNotifications, setReorderNotifications] = useState([]);
  const [inventoryUpdates, setInventoryUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/api/products");
      const fetchedProducts = Array.isArray(response.data) ? response.data : [];
      setProducts(fetchedProducts);
    } catch (err) {
      console.error("Error loading inventory products:", err);
      setError(
        err.response?.data?.message || "Failed to load inventory products."
      );
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setProducts([]);
      setError("");
      setLoading(false);
      return;
    }

    refreshProducts();
  }, [isAuthenticated, refreshProducts]);

  useEffect(() => {
    setStats(buildStats(products, autoReorderEnabled, autoReorderThreshold));
    setReorderNotifications((prev) =>
      mergeNotifications(products, autoReorderEnabled, autoReorderThreshold, prev)
    );
  }, [products, autoReorderEnabled, autoReorderThreshold]);

  const recordInventoryUpdate = useCallback((product, quantityChange, type) => {
    if (!product || !quantityChange) {
      return;
    }

    setInventoryUpdates((prev) => [
      {
        id: `${product.id}-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        quantity: Math.abs(quantityChange),
        timestamp: new Date().toISOString(),
        type,
      },
      ...prev,
    ].slice(0, 10));
  }, []);

  const updateProductStock = useCallback(
    (productId, quantityChange, type = "sale") => {
      setProducts((prevProducts) =>
        prevProducts.map((product) => {
          if (product.id !== productId) {
            return product;
          }

          const newStock =
            type === "restock"
              ? product.stock + quantityChange
              : Math.max(0, product.stock - quantityChange);

          const updatedProduct = {
            ...product,
            stock: newStock,
            status:
              newStock <= 0
                ? "Out of Stock"
                : newStock <= product.reorderLevel
                ? "Low Stock"
                : "In Stock",
          };

          recordInventoryUpdate(updatedProduct, quantityChange, type);
          return updatedProduct;
        })
      );
    },
    [recordInventoryUpdate]
  );

  const addProduct = useCallback(async (productToAdd) => {
    const stock = Number(productToAdd.stock || 0);
    const reorderLevel =
      Number(productToAdd.reorderLevel) || Math.max(1, Math.floor(stock * 0.2));

    const payload = {
      ...productToAdd,
      price: Number(productToAdd.price),
      cost: Number(productToAdd.cost || productToAdd.price),
      stock,
      reorderLevel,
    };

    const response = await api.post("/api/products", payload);
    setProducts((prevProducts) => [...prevProducts, response.data]);
    return response.data;
  }, []);

  const toggleAutoReorder = (enabled) => {
    setAutoReorderEnabled(enabled);
  };

  const updateAutoReorderThreshold = (threshold) => {
    setAutoReorderThreshold(Math.max(1, Number(threshold) || 1));
  };

  const clearReorderNotification = (notificationId) => {
    setReorderNotifications((prev) =>
      prev.filter((notification) => notification.id !== notificationId)
    );
  };

  const inventoryContextValue = {
    products,
    stats,
    loading,
    error,
    inventoryUpdates,
    refreshProducts,
    updateProductStock,
    addProduct,
    autoReorderEnabled,
    autoReorderThreshold,
    reorderNotifications,
    toggleAutoReorder,
    updateAutoReorderThreshold,
    clearReorderNotification,
  };

  return (
    <InventoryContext.Provider value={inventoryContextValue}>
      {children}
    </InventoryContext.Provider>
  );
};

const InventoryManagerDashboard = () => {
  const navigate = useNavigate();
  const inventoryContext = useContext(InventoryContext);

  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState("dashboard"); // dashboard, products, suppliers, purchaseOrders
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [savingProduct, setSavingProduct] = useState(false);
  const loadingStats = inventoryContext?.loading ?? true;
  const loadingProducts = inventoryContext?.loading ?? true;

  // Add product dialog state
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    category: "",
    price: "",
    stock: "",
    imageUrl: "",
  });

  // Categories - limited to 10 as requested
  const categories = [
    "Shirts",
    "Bastar Art Products",
    "Bottles",
    "Keyrings",
    "Canvas Bags",
    "Stationery",
    "Tribal Art",
    "Jewelry",
    "Handicrafts",
    "Souvenirs",
  ];

  // Update low stock products whenever inventory context changes
  useEffect(() => {
    if (inventoryContext && inventoryContext.products) {
      const lowStock = inventoryContext.products.filter((p) => {
        if (inventoryContext.autoReorderEnabled) {
          return p.stock <= inventoryContext.autoReorderThreshold;
        } else {
          return p.stock <= p.reorderLevel;
        }
      });

      setLowStockProducts(lowStock);
    }
  }, [inventoryContext]);

  useEffect(() => {
    if (inventoryContext && inventoryContext.products) {
      const lowStock = inventoryContext.products.filter((p) => {
        if (inventoryContext.autoReorderEnabled) {
          return p.stock <= inventoryContext.autoReorderThreshold;
        } else {
          return p.stock <= p.reorderLevel;
        }
      });
      setLowStockProducts(lowStock);
    }
  }, [
    inventoryContext?.autoReorderEnabled,
    inventoryContext?.autoReorderThreshold,
    inventoryContext?.products,
  ]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);

    // If switching to low stock tab, refresh the low stock products list
    if (newValue === 1 && inventoryContext && inventoryContext.products) {
      const lowStock = inventoryContext.products.filter((p) => {
        if (inventoryContext.autoReorderEnabled) {
          return p.stock <= inventoryContext.autoReorderThreshold;
        } else {
          return p.stock <= p.reorderLevel;
        }
      });

      setLowStockProducts(lowStock);
    }
  };

  // Handle opening the add product dialog
  const handleOpenAddProductDialog = () => {
    setAddProductDialogOpen(true);
  };

  // Handle closing the add product dialog
  const handleCloseAddProductDialog = () => {
    setAddProductDialogOpen(false);
    setNewProduct({
      name: "",
      sku: "",
      category: "",
      price: "",
      stock: "",
      imageUrl: "",
    });
  };

  // Handle adding a new product
  const handleAddProduct = async () => {
    try {
      setSavingProduct(true);
      await inventoryContext.addProduct({
        ...newProduct,
        imageUrl: newProduct.imageUrl || "https://via.placeholder.com/150",
      });
      handleCloseAddProductDialog();
    } catch (error) {
      console.error("Error adding product:", error);
    } finally {
      setSavingProduct(false);
    }
  };

  // Handle form change for new product
  const handleNewProductChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({
      ...newProduct,
      [name]: value,
    });
  };

  // Handle navigation to specific inventory views
  const handleNavigateToView = (view) => {
    setViewMode(view);
  };

  // Render content based on current view mode
  const renderContent = () => {
    switch (viewMode) {
      case "suppliers":
        return <SupplierManagement />;
      case "purchaseOrders":
        return (
          <PurchaseOrderManagement products={inventoryContext.products || []} />
        );
      default:
        // Default to dashboard view
        return (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={4}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <StatsCard
                    title="Total Products"
                    value={inventoryContext.stats?.totalProducts || 0}
                    icon={<InventoryIcon fontSize="large" />}
                    loading={loadingStats}
                    color="#4caf50"
                  />
                </motion.div>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <StatsCard
                    title="Total Stock"
                    value={inventoryContext.stats?.totalStock || 0}
                    icon={<CategoryIcon fontSize="large" />}
                    loading={loadingStats}
                    color="#2196f3"
                  />
                </motion.div>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <StatsCard
                    title="Low Stock Items"
                    value={lowStockProducts.length || 0}
                    icon={<WarningIcon fontSize="large" />}
                    loading={loadingStats}
                    color="#f44336"
                  />
                </motion.div>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Paper sx={{ mb: 4 }}>
                    <Tabs
                      value={activeTab}
                      onChange={handleTabChange}
                      indicatorColor="primary"
                      textColor="primary"
                      variant="fullWidth"
                    >
                      <Tab label="All Products" />
                      <Tab label="Low Stock" />
                    </Tabs>
                    <Box p={3}>
                      {activeTab === 0 ? (
                        <StockTable
                          products={inventoryContext.products || []}
                          loading={loadingProducts}
                          onEdit={() => {}}
                          onAdd={handleOpenAddProductDialog}
                        />
                      ) : (
                        <LowStockAlert
                          products={lowStockProducts}
                          loading={loadingProducts}
                          onCreatePurchaseOrder={() =>
                            handleNavigateToView("purchaseOrders")
                          }
                        />
                      )}
                    </Box>
                  </Paper>
                </motion.div>
              </Grid>

              <Grid item xs={12} md={4}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <RealTimeInventoryMonitor />
                  <Box mt={3}>
                    <AutoReorderSettings />
                  </Box>
                </motion.div>
              </Grid>
            </Grid>
          </>
        );
    }
  };

  return (
    <InteractiveBackground>
      <DashboardLayout>
        <Container
          maxWidth="xl"
          sx={{
            mt: 3,
            mb: 4,
            backgroundColor: alpha("#0c1e2b", 0.7),
            backdropFilter: "blur(10px)",
            borderRadius: 2,
            padding: 3,
            boxShadow:
              "0 8px 32px rgba(0, 0, 0, 0.3), 0 0 10px rgba(0, 255, 200, 0.1)",
            color: "#fff",
            border: "1px solid rgba(0, 200, 150, 0.1)",
            position: "relative",
            overflow: "hidden",
            zIndex: 1,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background:
                "radial-gradient(circle at top right, rgba(0,200,150,0.1) 0%, transparent 40%)",
              pointerEvents: "none",
              zIndex: -1,
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Box sx={{ mb: 4, display: "flex", alignItems: "center" }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: "bold",
                  color: "#fff",
                  textShadow: "0 0 10px rgba(0, 200, 150, 0.5)",
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <InventoryIcon sx={{ mr: 1, fontSize: 35 }} />
                {viewMode === "dashboard" && "Inventory Dashboard"}
                {viewMode === "suppliers" && "Supplier Management"}
                {viewMode === "purchaseOrders" && "Purchase Orders"}
              </Typography>
            </Box>
          </motion.div>

          <Box sx={{ mb: 4 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 1,
                  borderRadius: 2,
                  backgroundColor: alpha("#001924", 0.5),
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  justifyContent: "center",
                  border: "1px solid rgba(0, 200, 150, 0.2)",
                }}
              >
                <Button
                  variant={viewMode === "dashboard" ? "contained" : "outlined"}
                  startIcon={<ChartIcon />}
                  onClick={() => handleNavigateToView("dashboard")}
                  color="primary"
                  sx={{
                    m: 0.5,
                    borderRadius: 2,
                    boxShadow:
                      viewMode === "dashboard"
                        ? "0 0 15px rgba(0, 200, 150, 0.5)"
                        : "none",
                  }}
                >
                  Dashboard
                </Button>
                <Button
                  variant={viewMode === "suppliers" ? "contained" : "outlined"}
                  startIcon={<SupplierIcon />}
                  onClick={() => handleNavigateToView("suppliers")}
                  color="primary"
                  sx={{
                    m: 0.5,
                    borderRadius: 2,
                    boxShadow:
                      viewMode === "suppliers"
                        ? "0 0 15px rgba(0, 200, 150, 0.5)"
                        : "none",
                  }}
                >
                  Suppliers
                </Button>
                <Button
                  variant={
                    viewMode === "purchaseOrders" ? "contained" : "outlined"
                  }
                  startIcon={<PurchaseOrderIcon />}
                  onClick={() => handleNavigateToView("purchaseOrders")}
                  color="primary"
                  sx={{
                    m: 0.5,
                    borderRadius: 2,
                    boxShadow:
                      viewMode === "purchaseOrders"
                        ? "0 0 15px rgba(0, 200, 150, 0.5)"
                        : "none",
                  }}
                >
                  Purchase Orders
                </Button>
              </Paper>
            </motion.div>
          </Box>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {renderContent()}
          </motion.div>

          {/* Add Product Dialog */}
          <Dialog
            open={addProductDialogOpen}
            onClose={handleCloseAddProductDialog}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Add New Product</DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      name="name"
                      label="Product Name"
                      value={newProduct.name}
                      onChange={handleNewProductChange}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="sku"
                      label="SKU"
                      value={newProduct.sku}
                      onChange={handleNewProductChange}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel id="category-label">Category</InputLabel>
                      <Select
                        labelId="category-label"
                        id="category"
                        name="category"
                        value={newProduct.category}
                        label="Category"
                        onChange={handleNewProductChange}
                      >
                        {categories.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="price"
                      label="Price (₹)"
                      type="number"
                      value={newProduct.price}
                      onChange={handleNewProductChange}
                      fullWidth
                      required
                      InputProps={{
                        startAdornment: (
                          <Box component="span" mr={0.5}>
                            ₹
                          </Box>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="stock"
                      label="Stock"
                      type="number"
                      value={newProduct.stock}
                      onChange={handleNewProductChange}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="imageUrl"
                      label="Image URL"
                      value={newProduct.imageUrl}
                      onChange={handleNewProductChange}
                      fullWidth
                      placeholder="https://example.com/image.jpg"
                      helperText="Optional - Image that will be displayed in the customer dashboard"
                    />
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseAddProductDialog}>Cancel</Button>
              <Button
                onClick={handleAddProduct}
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                disabled={
                  savingProduct ||
                  !newProduct.name ||
                  !newProduct.sku ||
                  !newProduct.category ||
                  !newProduct.price ||
                  !newProduct.stock
                }
              >
                {savingProduct ? "Saving..." : "Add Product"}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </DashboardLayout>
    </InteractiveBackground>
  );
};

export default InventoryManagerDashboard;
