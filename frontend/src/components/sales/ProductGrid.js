import React, { useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Paper,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import FilterListIcon from "@mui/icons-material/FilterList";

const ProductGrid = ({ products, loading, onAddToCart }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  // Extract unique categories from products
  const categories = [
    "all",
    ...new Set(products.map((product) => product.category)),
  ];

  // Filter products based on search term and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Sort products based on sortBy option
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "price_low":
        return a.price - b.price;
      case "price_high":
        return b.price - a.price;
      case "stock_low":
        return a.stock - b.stock;
      default:
        return 0;
    }
  });

  const handleAddToCart = (product) => {
    if (onAddToCart && product.stock > 0) {
      onAddToCart({
        ...product,
        quantity: 1,
      });
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="300px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="category-filter-label">Category</InputLabel>
              <Select
                labelId="category-filter-label"
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <FilterListIcon fontSize="small" />
                  </InputAdornment>
                }
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="sort-by-label">Sort By</InputLabel>
              <Select
                labelId="sort-by-label"
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="name">Name (A-Z)</MenuItem>
                <MenuItem value="price_low">Price (Low to High)</MenuItem>
                <MenuItem value="price_high">Price (High to Low)</MenuItem>
                <MenuItem value="stock_low">Stock (Low to High)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="body2" color="text.secondary">
              {sortedProducts.length} products found
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {sortedProducts.length === 0 ? (
        <Box textAlign="center" py={5}>
          <Typography variant="h6" color="text.secondary">
            No products found matching your search.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {sortedProducts.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                {product.stock <= 0 && (
                  <Chip
                    label="Out of Stock"
                    color="error"
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      zIndex: 1,
                    }}
                  />
                )}
                {product.stock > 0 && product.stock <= 5 && (
                  <Chip
                    label={`Only ${product.stock} left`}
                    color="warning"
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      zIndex: 1,
                    }}
                  />
                )}
                <CardMedia
                  component="img"
                  height="140"
                  image={
                    product.imageUrl ||
                    `https://via.placeholder.com/140x140?text=${product.name}`
                  }
                  alt={product.name}
                  sx={{ objectFit: "contain", bgcolor: "#f5f5f5" }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box mb={2}>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      startIcon={<AddShoppingCartIcon />}
                      disabled={product.stock <= 0}
                      onClick={() => handleAddToCart(product)}
                    >
                      Add to Cart
                    </Button>
                  </Box>
                  <Typography variant="h6" component="div" noWrap>
                    {product.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    SKU: {product.sku}
                  </Typography>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mt={1}
                  >
                    <Typography variant="h6" color="primary">
                      {formatCurrency(product.price)}
                    </Typography>
                    <Chip
                      label={product.category}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );
};

export default ProductGrid;
