import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
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
  InputAdornment,
  Chip,
  TablePagination,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  LocalShipping as SupplierIcon,
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
} from "@mui/icons-material";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const PurchaseOrderManagement = ({ products = [] }) => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [newOrder, setNewOrder] = useState({
    supplier: "",
    expectedDeliveryDate: "",
    items: [{ productId: "", quantity: 1, price: 0 }],
    notes: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersRes, suppliersRes] = await Promise.all([
        axios.get(`${API_URL}/purchase-orders`),
        axios.get(`${API_URL}/suppliers`),
      ]);
      setPurchaseOrders(ordersRes.data);
      setSuppliers(suppliersRes.data);
    } catch (error) {
      console.error("Error loading purchase order data:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to load purchase orders.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredOrders = useMemo(() => {
    const lower = search.toLowerCase();
    return purchaseOrders.filter((order) => {
      const orderKey = (order.orderNumber || order.id || "").toLowerCase();
      const supplierName = (order.supplierName || "").toLowerCase();
      const matchesSearch = orderKey.includes(lower) || supplierName.includes(lower);
      const matchesStatus =
        statusFilter === "All" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [purchaseOrders, search, statusFilter]);

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...newOrder.items];

    if (field === "productId") {
      const selectedProduct = products.find(
        (product) => (product.id || product._id) === value
      );
      if (selectedProduct) {
        updatedItems[index] = {
          ...updatedItems[index],
          productId: value,
          price: selectedProduct.cost || selectedProduct.price,
        };
      }
    } else if (field === "quantity") {
      updatedItems[index] = {
        ...updatedItems[index],
        quantity: Number(value) || 1,
      };
    }

    setNewOrder((prev) => ({ ...prev, items: updatedItems }));
  };

  const calculateTotalAmount = () =>
    newOrder.items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "success";
      case "pending":
        return "warning";
      case "delivered":
        return "info";
      case "cancelled":
        return "error";
      case "shipped":
        return "secondary";
      default:
        return "default";
    }
  };

  const handleSaveOrder = async () => {
    try {
      await axios.post(`${API_URL}/purchase-orders`, {
        supplier: newOrder.supplier,
        expectedDeliveryDate: newOrder.expectedDeliveryDate || undefined,
        notes: newOrder.notes,
        items: newOrder.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      setMessage({ type: "success", text: "Purchase order created successfully." });
      setCreateDialogOpen(false);
      setNewOrder({
        supplier: "",
        expectedDeliveryDate: "",
        items: [{ productId: "", quantity: 1, price: 0 }],
        notes: "",
      });
      loadData();
    } catch (error) {
      console.error("Error creating purchase order:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to create purchase order.",
      });
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await axios.patch(`${API_URL}/purchase-orders/${orderId}/status`, { status });
      setMessage({ type: "success", text: `Purchase order updated to ${status}.` });
      setViewDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Error updating purchase order status:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update purchase order.",
      });
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`${API_URL}/purchase-orders/${orderToDelete._id || orderToDelete.id}`);
      setMessage({ type: "success", text: "Purchase order deleted successfully." });
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
      loadData();
    } catch (error) {
      console.error("Error deleting purchase order:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to delete purchase order.",
      });
    }
  };

  return (
    <Box>
      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage({ type: "", text: "" })}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            placeholder="Search orders..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            variant="outlined"
            size="small"
            sx={{ width: "250px" }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              label="Status"
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="shipped">Shipped</MenuItem>
              <MenuItem value="delivered">Delivered</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => setCreateDialogOpen(true)}>
          Create Order
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table sx={{ minWidth: 800 }} size="medium">
          <TableHead>
            <TableRow sx={{ backgroundColor: "grey.50" }}>
              <TableCell><Typography variant="subtitle2">Order Number</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Date</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Supplier</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Total Amount</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Status</Typography></TableCell>
              <TableCell align="right"><Typography variant="subtitle2">Actions</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">Loading purchase orders...</Typography>
                </TableCell>
              </TableRow>
            ) : filteredOrders.length > 0 ? (
              filteredOrders
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((order) => (
                  <TableRow key={order._id || order.id} hover>
                    <TableCell><Typography variant="body2" fontWeight={500}>{order.orderNumber || order.id}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{formatDate(order.orderDate)}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{order.supplierName}</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={500}>{formatCurrency(order.totalAmount)}</Typography></TableCell>
                    <TableCell>
                      <Chip label={order.status} size="small" color={getStatusColor(order.status)} sx={{ minWidth: "90px" }} />
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        <IconButton size="small" color="primary" onClick={() => { setCurrentOrder(order); setViewDialogOpen(true); }} title="View Order">
                          <ViewIcon fontSize="small" />
                        </IconButton>
                        {order.status === "pending" && (
                          <>
                            <IconButton size="small" color="success" onClick={() => handleUpdateStatus(order._id || order.id, "confirmed")} title="Approve Order">
                              <ApproveIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleUpdateStatus(order._id || order.id, "cancelled")} title="Cancel Order">
                              <RejectIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                        {order.status === "confirmed" && (
                          <IconButton size="small" color="info" onClick={() => handleUpdateStatus(order._id || order.id, "delivered")} title="Mark as Delivered">
                            <SupplierIcon fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton size="small" color="error" onClick={() => { setOrderToDelete(order); setDeleteDialogOpen(true); }} title="Delete Order">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">No purchase orders found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredOrders.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(event, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
      />

      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Purchase Order: {currentOrder?.orderNumber || currentOrder?.id}</Typography>
            <Chip label={currentOrder?.status} size="small" color={getStatusColor(currentOrder?.status)} />
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {currentOrder && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Order Date</Typography>
                  <Typography variant="body1">{formatDate(currentOrder.orderDate)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Supplier</Typography>
                  <Typography variant="body1">{currentOrder.supplierName}</Typography>
                </Grid>
              </Grid>
              <Typography variant="subtitle1" gutterBottom>Order Items</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "grey.50" }}>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentOrder.items.map((item, index) => (
                      <TableRow key={`${currentOrder.id}-${index}`}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(item.total)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align="right" sx={{ fontWeight: "bold" }}>Total Amount:</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>{formatCurrency(currentOrder.totalAmount)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Purchase Order</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="expectedDeliveryDate"
                  label="Expected Delivery Date"
                  type="date"
                  value={newOrder.expectedDeliveryDate}
                  onChange={(e) => setNewOrder((prev) => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel id="supplier-label">Supplier</InputLabel>
                  <Select
                    labelId="supplier-label"
                    value={newOrder.supplier}
                    label="Supplier"
                    onChange={(e) => setNewOrder((prev) => ({ ...prev, supplier: e.target.value }))}
                  >
                    {suppliers.map((supplier) => (
                      <MenuItem key={supplier._id || supplier.id} value={supplier._id || supplier.id}>
                        {supplier.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>Order Items</Typography>

            {newOrder.items.map((item, index) => (
              <Box key={`new-item-${index}`} sx={{ mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel id={`product-label-${index}`}>Product</InputLabel>
                      <Select
                        labelId={`product-label-${index}`}
                        value={item.productId}
                        label="Product"
                        onChange={(e) => handleItemChange(index, "productId", e.target.value)}
                      >
                        {products.map((product) => (
                          <MenuItem key={product.id || product._id} value={product.id || product._id}>
                            {product.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={4} sm={2}>
                    <TextField
                      label="Quantity"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                      fullWidth
                      InputProps={{ inputProps: { min: 1 } }}
                    />
                  </Grid>
                  <Grid item xs={4} sm={2}>
                    <TextField label="Price" value={item.price} disabled fullWidth />
                  </Grid>
                  <Grid item xs={4} sm={2} sx={{ display: "flex", justifyContent: "center" }}>
                    <IconButton
                      color="error"
                      onClick={() =>
                        setNewOrder((prev) => ({
                          ...prev,
                          items:
                            prev.items.length === 1
                              ? prev.items
                              : prev.items.filter((_, itemIndex) => itemIndex !== index),
                        }))
                      }
                      disabled={newOrder.items.length === 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
            ))}

            <Box sx={{ mt: 2, mb: 3 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() =>
                  setNewOrder((prev) => ({
                    ...prev,
                    items: [...prev.items, { productId: "", quantity: 1, price: 0 }],
                  }))
                }
              >
                Add Item
              </Button>
            </Box>

            <TextField
              label="Notes"
              value={newOrder.notes}
              onChange={(e) => setNewOrder((prev) => ({ ...prev, notes: e.target.value }))}
              fullWidth
              multiline
              rows={3}
            />

            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
              <Typography variant="subtitle1">Total Amount:</Typography>
              <Typography variant="h6">{formatCurrency(calculateTotalAmount())}</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveOrder}
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            disabled={
              !newOrder.supplier ||
              newOrder.items.some((item) => !item.productId || !item.quantity) ||
              calculateTotalAmount() === 0
            }
          >
            Create Order
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete purchase order "{orderToDelete?.orderNumber || orderToDelete?.id}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PurchaseOrderManagement;
