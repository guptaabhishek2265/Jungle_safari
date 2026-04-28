import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material";

const DEFAULT_API_URL =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000/api";
const API_URL = process.env.REACT_APP_API_URL || DEFAULT_API_URL;

const emptySupplier = {
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  categories: "",
  status: "Active",
  notes: "",
};

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState(emptySupplier);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/suppliers`);
      setSuppliers(response.data);
      setFilteredSuppliers(response.data);
    } catch (error) {
      console.error("Error loading suppliers:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to load suppliers.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    const lowercasedSearch = search.toLowerCase();
    const filtered = suppliers.filter((supplier) => {
      const categories = Array.isArray(supplier.categories)
        ? supplier.categories.join(", ")
        : supplier.categories || "";

      return (
        supplier.name.toLowerCase().includes(lowercasedSearch) ||
        (supplier.contactPerson || "").toLowerCase().includes(lowercasedSearch) ||
        categories.toLowerCase().includes(lowercasedSearch) ||
        supplier.email.toLowerCase().includes(lowercasedSearch)
      );
    });

    setFilteredSuppliers(filtered);
  }, [suppliers, search]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
    setNewSupplier(emptySupplier);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setCurrentSupplier(null);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSupplierToDelete(null);
  };

  const handleAddFormChange = (e) => {
    const { name, value } = e.target;
    setNewSupplier((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentSupplier((prev) => ({ ...prev, [name]: value }));
  };

  const normalizeSupplierPayload = (supplier) => ({
    name: supplier.name,
    contactPerson: supplier.contactPerson,
    email: supplier.email,
    phone: supplier.phone,
    address: supplier.address,
    categories: supplier.categories
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    notes: supplier.notes,
    isActive: supplier.status === "Active",
  });

  const handleSaveNewSupplier = async () => {
    try {
      await axios.post(`${API_URL}/suppliers`, normalizeSupplierPayload(newSupplier));
      setMessage({ type: "success", text: `Supplier "${newSupplier.name}" added successfully.` });
      handleCloseAddDialog();
      loadSuppliers();
    } catch (error) {
      console.error("Error creating supplier:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to create supplier.",
      });
    }
  };

  const handleSaveSupplier = async () => {
    try {
      await axios.put(
        `${API_URL}/suppliers/${currentSupplier._id || currentSupplier.id}`,
        normalizeSupplierPayload(currentSupplier)
      );
      setMessage({
        type: "success",
        text: `Supplier "${currentSupplier.name}" updated successfully.`,
      });
      handleCloseEditDialog();
      loadSuppliers();
    } catch (error) {
      console.error("Error updating supplier:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update supplier.",
      });
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`${API_URL}/suppliers/${supplierToDelete._id || supplierToDelete.id}`);
      setMessage({
        type: "success",
        text: `Supplier "${supplierToDelete.name}" deleted successfully.`,
      });
      handleCloseDeleteDialog();
      loadSuppliers();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to delete supplier.",
      });
    }
  };

  const toFormSupplier = (supplier) => ({
    ...supplier,
    contactPerson: supplier.contactPerson || supplier.contact || "",
    categories: Array.isArray(supplier.categories)
      ? supplier.categories.join(", ")
      : supplier.categories || "",
    status: supplier.status || (supplier.isActive ? "Active" : "Inactive"),
    notes: supplier.notes || "",
  });

  return (
    <Box>
      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage({ type: "", text: "" })}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between" }}>
        <TextField
          placeholder="Search suppliers..."
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
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => setAddDialogOpen(true)}>
          Add Supplier
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table sx={{ minWidth: 800 }} size="medium">
          <TableHead>
            <TableRow sx={{ backgroundColor: "grey.50" }}>
              <TableCell><Typography variant="subtitle2">Supplier Name</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Contact Person</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Contact Info</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Address</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Categories</Typography></TableCell>
              <TableCell><Typography variant="subtitle2">Status</Typography></TableCell>
              <TableCell align="right"><Typography variant="subtitle2">Actions</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">Loading suppliers...</Typography>
                </TableCell>
              </TableRow>
            ) : filteredSuppliers.length > 0 ? (
              filteredSuppliers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((supplier) => (
                  <TableRow key={supplier._id || supplier.id} hover>
                    <TableCell><Typography variant="body2" fontWeight={500}>{supplier.name}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{supplier.contactPerson}</Typography></TableCell>
                    <TableCell>
                      <Box>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                          <EmailIcon fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />
                          <Typography variant="body2">{supplier.email}</Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <PhoneIcon fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />
                          <Typography variant="body2">{supplier.phone}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <LocationIcon fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />
                        <Typography variant="body2">{supplier.address}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {Array.isArray(supplier.categories) ? supplier.categories.join(", ") : supplier.categories}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={supplier.status}
                        size="small"
                        color={supplier.status === "Active" ? "success" : "default"}
                        sx={{ minWidth: "80px" }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="primary" onClick={() => { setCurrentSupplier(toFormSupplier(supplier)); setEditDialogOpen(true); }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => { setSupplierToDelete(supplier); setDeleteDialogOpen(true); }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">No suppliers found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredSuppliers.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      <Dialog open={addDialogOpen} onClose={handleCloseAddDialog} maxWidth="md" fullWidth>
        <DialogTitle>Add New Supplier</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}><TextField name="name" label="Supplier Name" value={newSupplier.name} onChange={handleAddFormChange} fullWidth required /></Grid>
              <Grid item xs={12} sm={6}><TextField name="contactPerson" label="Contact Person" value={newSupplier.contactPerson} onChange={handleAddFormChange} fullWidth required /></Grid>
              <Grid item xs={12} sm={6}><TextField name="email" label="Email" type="email" value={newSupplier.email} onChange={handleAddFormChange} fullWidth required /></Grid>
              <Grid item xs={12} sm={6}><TextField name="phone" label="Phone" value={newSupplier.phone} onChange={handleAddFormChange} fullWidth required /></Grid>
              <Grid item xs={12}><TextField name="address" label="Address" value={newSupplier.address} onChange={handleAddFormChange} fullWidth required /></Grid>
              <Grid item xs={12} sm={6}><TextField name="categories" label="Categories (comma separated)" value={newSupplier.categories} onChange={handleAddFormChange} fullWidth /></Grid>
              <Grid item xs={12} sm={6}>
                <TextField name="status" label="Status" select value={newSupplier.status} onChange={handleAddFormChange} fullWidth required SelectProps={{ native: true }}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </TextField>
              </Grid>
              <Grid item xs={12}><TextField name="notes" label="Notes" value={newSupplier.notes} onChange={handleAddFormChange} fullWidth multiline rows={3} /></Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button onClick={handleSaveNewSupplier} variant="contained" color="primary" startIcon={<SaveIcon />} disabled={!newSupplier.name || !newSupplier.email || !newSupplier.phone}>
            Add Supplier
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>Edit Supplier</DialogTitle>
        <DialogContent>
          {currentSupplier && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}><TextField name="name" label="Supplier Name" value={currentSupplier.name} onChange={handleEditFormChange} fullWidth required /></Grid>
                <Grid item xs={12} sm={6}><TextField name="contactPerson" label="Contact Person" value={currentSupplier.contactPerson} onChange={handleEditFormChange} fullWidth required /></Grid>
                <Grid item xs={12} sm={6}><TextField name="email" label="Email" type="email" value={currentSupplier.email} onChange={handleEditFormChange} fullWidth required /></Grid>
                <Grid item xs={12} sm={6}><TextField name="phone" label="Phone" value={currentSupplier.phone} onChange={handleEditFormChange} fullWidth required /></Grid>
                <Grid item xs={12}><TextField name="address" label="Address" value={currentSupplier.address} onChange={handleEditFormChange} fullWidth required /></Grid>
                <Grid item xs={12} sm={6}><TextField name="categories" label="Categories (comma separated)" value={currentSupplier.categories} onChange={handleEditFormChange} fullWidth /></Grid>
                <Grid item xs={12} sm={6}>
                  <TextField name="status" label="Status" select value={currentSupplier.status} onChange={handleEditFormChange} fullWidth required SelectProps={{ native: true }}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </TextField>
                </Grid>
                <Grid item xs={12}><TextField name="notes" label="Notes" value={currentSupplier.notes} onChange={handleEditFormChange} fullWidth multiline rows={3} /></Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleSaveSupplier} variant="contained" color="primary" startIcon={<SaveIcon />} disabled={!currentSupplier}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete supplier "{supplierToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupplierManagement;
