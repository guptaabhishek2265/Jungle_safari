import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Box,
  Alert,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  TablePagination,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import axios from "axios";

import ProductsTable from "../../components/inventory/ProductsTable";
import ProductForm from "../../components/inventory/ProductForm";
import { useAuth } from "../../context/AuthContext";

// Define product categories
const CATEGORIES = [
  "Apparel",
  "Bastar Art",
  "Bottles",
  "Souvenirs",
  "Books",
  "Equipment",
  "Footwear",
  "Health",
  "Food",
  "Maps",
  "Accessories",
];

const ProductManagement = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    severity: "info",
  });
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Set up axios interceptor to add auth token to all requests
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    // Remove interceptor when component unmounts
    return () => {
      delete axios.defaults.headers.common["Authorization"];
    };
  }, []);

  // Fetch all products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

      const response = await axios.get(`${API_URL}/products`);

      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      showAlert("Failed to load products. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch suppliers for the product form
  const fetchSuppliers = useCallback(async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

      const response = await axios.get(`${API_URL}/suppliers`);

      setSuppliers(response.data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, [fetchProducts, fetchSuppliers]);

  // Show alert message
  const showAlert = (message, severity = "success") => {
    setAlert({ show: true, message, severity });

    // Auto hide after 5 seconds
    setTimeout(() => {
      setAlert({ show: false, message: "", severity: "info" });
    }, 5000);
  };

  // Form handlers
  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingProduct(null);
  };

  // Create or update a product
  const handleSaveProduct = async (productData) => {
    try {
      // Make sure we have a valid cost price (required by backend model)
      const formattedData = {
        ...productData,
        cost: productData.cost || productData.price, // Default to price if cost not provided
      };

      // Add API_URL prefix to requests
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

      if (editingProduct) {
        // Update existing product
        await axios.put(
          `${API_URL}/products/${editingProduct._id}`,
          formattedData
        );
        showAlert("Product updated successfully!");
      } else {
        // Create new product
        await axios.post(`${API_URL}/products`, formattedData);
        showAlert("Product added successfully!");
      }

      // Refresh products list and close form
      fetchProducts();
      handleCloseForm();
    } catch (error) {
      console.error("Error saving product:", error);
      showAlert(
        error.response?.data?.message ||
        "Failed to save product. Please try again.",
        "error"
      );
    }
  };

  // Delete a product
  const handleDeleteProduct = async (productId) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

      await axios.delete(`${API_URL}/products/${productId}`);

      showAlert("Product deleted successfully.");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      showAlert(
        error.response?.data?.message ||
        "Failed to delete product. Please try again.",
        "error"
      );
    }
  };

  // Check if user has permission to manage products
  const hasPermission =
    user && (user.role === "admin" || user.role === "inventory_manager");

  if (!hasPermission) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" color="error">
            Access Denied
          </Typography>
          <Typography>
            You do not have permission to access the product management page.
          </Typography>
        </Paper>
      </Container>
    );
  }

  // Filter products when search or products change
  useEffect(() => {
    if (!products || products.length === 0) {
      setFilteredProducts([]);
      return;
    }

    const lowercasedSearch = search.toLowerCase();
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(lowercasedSearch) ||
        product.sku.toLowerCase().includes(lowercasedSearch) ||
        product.category.toLowerCase().includes(lowercasedSearch)
    );

    setFilteredProducts(filtered);
  }, [products, search]);

  // Handle search change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(0);
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Open edit dialog
  const handleEditProductDialog = (product) => {
    setCurrentProduct({ ...product });
    setEditDialogOpen(true);
  };

  // Close edit dialog
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setCurrentProduct(null);
  };

  // Handle form field change in edit dialog
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct({
      ...currentProduct,
      [name]:
        name === "price" || name === "stock" || name === "reorderLevel"
          ? parseFloat(value)
          : value,
    });
  };

  // Save product changes
  const handleSaveProductDialog = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
      await axios.put(`${API_URL}/products/${currentProduct._id || currentProduct.id}`, {
        name: currentProduct.name,
        category: currentProduct.category,
        price: currentProduct.price,
        reorderLevel: currentProduct.reorderLevel,
        imageUrl: currentProduct.imageUrl,
      });

      setSuccessMessage(`Product "${currentProduct.name}" updated successfully.`);
      fetchProducts();
      handleCloseEditDialog();
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error updating product:", error);
      showAlert(
        error.response?.data?.message || "Failed to update product.",
        "error"
      );
    }
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  // Close delete dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  // Confirm product deletion
  const handleConfirmDelete = async () => {
    try {
      await handleDeleteProduct(productToDelete._id || productToDelete.id);
      setSuccessMessage(
        `Product "${productToDelete.name}" deleted successfully.`
      );
      handleCloseDeleteDialog();
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {alert.show && (
        <Alert
          severity={alert.severity}
          sx={{ mb: 2 }}
          onClose={() => setAlert({ ...alert, show: false })}
        >
          {alert.message}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <ProductsTable
          products={products}
          loading={loading}
          categories={CATEGORIES}
          onAddProduct={handleAddProduct}
          onEditProduct={handleEditProduct}
          onDeleteProduct={handleDeleteProduct}
        />
      </Box>

      <ProductForm
        open={formOpen}
        onClose={handleCloseForm}
        onSave={handleSaveProduct}
        product={editingProduct}
        suppliers={suppliers}
        loadingSuppliers={loading}
        isEditing={!!editingProduct}
      />

      {/* Success message alert */}
      {successMessage && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccessMessage("")}
        >
          {successMessage}
        </Alert>
      )}

      {/* Search and Add toolbar */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between" }}>
        <TextField
          placeholder="Search products..."
          value={search}
          onChange={handleSearchChange}
          variant="outlined"
          size="small"
          sx={{ width: "300px" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddProduct}
        >
          Add Product
        </Button>
      </Box>

      {/* Products table */}
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table sx={{ minWidth: 800 }} size="medium">
          <TableHead>
            <TableRow sx={{ backgroundColor: "grey.50" }}>
              <TableCell>
                <Typography variant="subtitle2">Product Name</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2">SKU</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2">Category</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2">Price</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2">Stock</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2">Reorder Level</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2">Status</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle2">Actions</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts.length > 0 ? (
              filteredProducts
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((product) => (
                  <TableRow key={product.id} hover>
                    <TableCell>
                      <Typography variant="body2">{product.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{product.sku}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {product.category}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatCurrency(product.price)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={
                          product.stock <= product.reorderLevel
                            ? "error.main"
                            : "inherit"
                        }
                        fontWeight={
                          product.stock <= product.reorderLevel
                            ? "bold"
                            : "normal"
                        }
                      >
                        {product.stock}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {product.reorderLevel}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={product.status}
                        size="small"
                        color={
                          product.status === "Low Stock" ? "error" : "success"
                        }
                        sx={{ minWidth: "90px" }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditProductDialog(product)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(product)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    No products found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredProducts.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Edit Product Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Product</DialogTitle>
        <DialogContent>
          {currentProduct && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    name="name"
                    label="Product Name"
                    value={currentProduct.name}
                    onChange={handleEditFormChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="sku"
                    label="SKU"
                    value={currentProduct.sku}
                    onChange={handleEditFormChange}
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
                      value={currentProduct.category}
                      label="Category"
                      onChange={handleEditFormChange}
                    >
                      {CATEGORIES.map((category) => (
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
                    value={currentProduct.price}
                    onChange={handleEditFormChange}
                    fullWidth
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">₹</InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="stock"
                    label="Stock"
                    type="number"
                    value={currentProduct.stock}
                    onChange={handleEditFormChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="reorderLevel"
                    label="Reorder Level"
                    type="number"
                    value={currentProduct.reorderLevel}
                    onChange={handleEditFormChange}
                    fullWidth
                    required
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button
            onClick={handleSaveProductDialog}
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            disabled={!currentProduct}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete product "{productToDelete?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProductManagement;
