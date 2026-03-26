import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  Grid,
  Typography,
  Paper,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  alpha,
  Container,
} from "@mui/material";
import {
  AttachMoney as MoneyIcon,
  CalendarMonth as CalendarIcon,
  Inventory as InventoryIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";

import DashboardLayout from "../../components/common/DashboardLayout";
import StatsCard from "../../components/dashboard/StatsCard";
import { InventoryContext } from "../inventory/Dashboard";
import SalesChart from "../../components/dashboard/SalesChart";
import TopSellingProducts from "../../components/dashboard/TopSellingProducts";
import api from "../../utils/api";
import "../../components/dashboard/animations.css";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const DarkOverlay = ({ children }) => (
  <Box
    sx={{
      position: "relative",
      zIndex: 1,
      minHeight: "100vh",
      width: "100%",
      "&::before": {
        content: '""',
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: "url('/images/img7.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        filter: "brightness(0.3)",
        zIndex: -1,
      },
    }}
  >
    {children}
  </Box>
);

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number(amount || 0));

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

const paymentLabel = (method) => {
  switch (method) {
    case "cash":
      return "Cash";
    case "upi":
      return "UPI";
    case "card":
      return "Card";
    case "credit-card":
      return "Credit Card";
    case "debit-card":
      return "Debit Card";
    default:
      return method || "Unknown";
  }
};

const SalesDashboard = () => {
  const inventoryContext = useContext(InventoryContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/api/orders");
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error loading sales orders:", err);
      setError(err.response?.data?.msg || "Failed to load sales data.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const analytics = useMemo(() => {
    const completedOrders = orders.filter((order) => order.status === "completed");
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const currentMonthKey = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    let dailySales = 0;
    let monthlySales = 0;
    const monthlyCustomers = new Set();
    const topProductMap = new Map();
    const weekBuckets = new Map();
    const monthBuckets = new Map();
    const yearBuckets = new Map();

    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      weekBuckets.set(date.toISOString().slice(0, 10), 0);
    }

    for (let i = 3; i >= 0; i -= 1) {
      const bucketDate = new Date(now);
      bucketDate.setDate(now.getDate() - i * 7);
      monthBuckets.set(`Week ${4 - i}`, 0);
    }

    for (let i = 11; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = date.toLocaleString("en-US", { month: "short" });
      yearBuckets.set(label, 0);
    }

    completedOrders.forEach((order) => {
      const orderDate = new Date(order.date || order.createdAt || Date.now());
      const orderDay = orderDate.toISOString().slice(0, 10);
      const orderMonth = `${orderDate.getFullYear()}-${String(
        orderDate.getMonth() + 1
      ).padStart(2, "0")}`;
      const orderTotal = Number(order.totalAmount || order.total || 0);

      if (orderDay === todayKey) {
        dailySales += orderTotal;
      }

      if (orderMonth === currentMonthKey) {
        monthlySales += orderTotal;
        if (order.customer?.email) {
          monthlyCustomers.add(order.customer.email);
        }
      }

      if (weekBuckets.has(orderDay)) {
        weekBuckets.set(orderDay, weekBuckets.get(orderDay) + orderTotal);
      }

      const dayDiff = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));
      if (dayDiff >= 0 && dayDiff < 28) {
        const weekIndex = Math.min(3, Math.floor(dayDiff / 7));
        const weekLabel = `Week ${4 - weekIndex}`;
        monthBuckets.set(weekLabel, (monthBuckets.get(weekLabel) || 0) + orderTotal);
      }

      const monthLabel = orderDate.toLocaleString("en-US", { month: "short" });
      if (yearBuckets.has(monthLabel) && orderDate.getFullYear() === now.getFullYear()) {
        yearBuckets.set(monthLabel, yearBuckets.get(monthLabel) + orderTotal);
      }

      (order.items || []).forEach((item) => {
        const existing = topProductMap.get(item.name) || {
          name: item.name,
          sales: 0,
          amount: 0,
        };
        existing.sales += Number(item.quantity || 0);
        existing.amount += Number(item.quantity || 0) * Number(item.price || 0);
        topProductMap.set(item.name, existing);
      });
    });

    return {
      stats: {
        dailySales,
        monthlySales,
        totalProducts: inventoryContext?.stats?.totalProducts || 0,
        customerCount: monthlyCustomers.size,
      },
      recentSales: completedOrders.slice(0, 10),
      topProducts: Array.from(topProductMap.values())
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5),
      chartData: {
        week: {
          labels: Array.from(weekBuckets.keys()).map((key) =>
            new Date(key).toLocaleString("en-US", { weekday: "short" })
          ),
          data: Array.from(weekBuckets.values()),
        },
        month: {
          labels: Array.from(monthBuckets.keys()),
          data: Array.from(monthBuckets.values()),
        },
        year: {
          labels: Array.from(yearBuckets.keys()),
          data: Array.from(yearBuckets.values()),
        },
      },
    };
  }, [orders, inventoryContext?.stats?.totalProducts]);

  return (
    <DarkOverlay>
      <DashboardLayout>
        <Container
          maxWidth="xl"
          sx={{
            mt: 3,
            mb: 4,
            backgroundColor: alpha("#000", 0.7),
            backdropFilter: "blur(8px)",
            borderRadius: 2,
            padding: 3,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
            color: "#fff",
          }}
        >
          <Box
            sx={{
              mb: 4,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: "bold",
                  color: "#fff",
                  textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                  mb: 1,
                }}
              >
                <MoneyIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                Sales Dashboard
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  color: "rgba(255, 255, 255, 0.7)",
                }}
              >
                Sales metrics now come from MongoDB orders instead of browser-only demo data.
              </Typography>
            </Box>

            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={loadOrders}
              disabled={loading}
            >
              Refresh Sales
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ flexGrow: 1 }}>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <motion.div variants={itemVariants}>
                    <StatsCard
                      title="Today's Sales"
                      value={formatCurrency(analytics.stats.dailySales)}
                      icon={<CalendarIcon />}
                      color="#0ea5e9"
                      loading={loading}
                    />
                  </motion.div>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <motion.div variants={itemVariants}>
                    <StatsCard
                      title="Monthly Sales"
                      value={formatCurrency(analytics.stats.monthlySales)}
                      icon={<MoneyIcon />}
                      color="#10b981"
                      loading={loading}
                    />
                  </motion.div>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <motion.div variants={itemVariants}>
                    <StatsCard
                      title="Products"
                      value={String(analytics.stats.totalProducts)}
                      icon={<InventoryIcon />}
                      color="#f59e0b"
                      loading={loading || inventoryContext?.loading}
                    />
                  </motion.div>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <motion.div variants={itemVariants}>
                    <StatsCard
                      title="Monthly Customers"
                      value={String(analytics.stats.customerCount)}
                      icon={<PersonIcon />}
                      color="#ec4899"
                      loading={loading}
                    />
                  </motion.div>
                </Grid>

                <Grid item xs={12}>
                  <motion.div variants={itemVariants}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        backgroundColor: alpha("#000", 0.5),
                        backdropFilter: "blur(5px)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          mb: 2,
                          color: "#fff",
                          fontWeight: "bold",
                        }}
                      >
                        Recent Sales
                      </Typography>

                      {loading ? (
                        <Box sx={{ textAlign: "center", py: 2 }}>
                          <Typography variant="body1" color="textSecondary">
                            Loading recent sales...
                          </Typography>
                        </Box>
                      ) : analytics.recentSales.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: 2 }}>
                          <Typography variant="body1" color="textSecondary">
                            No sales records found
                          </Typography>
                        </Box>
                      ) : (
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                                  Date
                                </TableCell>
                                <TableCell sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                                  Products
                                </TableCell>
                                <TableCell sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                                  Customer
                                </TableCell>
                                <TableCell sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                                  Payment
                                </TableCell>
                                <TableCell
                                  align="right"
                                  sx={{ color: "rgba(255, 255, 255, 0.8)" }}
                                >
                                  Amount
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {analytics.recentSales.map((sale) => (
                                <TableRow key={sale._id}>
                                  <TableCell sx={{ color: "#fff" }}>
                                    {formatDate(sale.date || sale.createdAt)}
                                  </TableCell>
                                  <TableCell sx={{ color: "#fff" }}>
                                    {(sale.items || [])
                                      .map((item) => `${item.name} (${item.quantity})`)
                                      .join(", ")}
                                  </TableCell>
                                  <TableCell sx={{ color: "#fff" }}>
                                    {sale.customer?.name || "Guest"}
                                  </TableCell>
                                  <TableCell sx={{ color: "#fff" }}>
                                    <Chip
                                      label={paymentLabel(sale.payment?.method)}
                                      size="small"
                                      color={
                                        sale.payment?.method === "cash" ? "default" : "primary"
                                      }
                                      variant="outlined"
                                    />
                                  </TableCell>
                                  <TableCell
                                    align="right"
                                    sx={{ color: "#0ea5e9", fontWeight: "bold" }}
                                  >
                                    {formatCurrency(sale.totalAmount)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Paper>
                  </motion.div>
                </Grid>

                <Grid item xs={12} md={8}>
                  <motion.div variants={itemVariants}>
                    <SalesChart
                      title="Sales Trend"
                      data={analytics.chartData}
                      className="sales-chart-container"
                    />
                  </motion.div>
                </Grid>

                <Grid item xs={12} md={4}>
                  <motion.div variants={itemVariants}>
                    <TopSellingProducts
                      height={380}
                      products={analytics.topProducts}
                      className="top-products-container"
                    />
                  </motion.div>
                </Grid>
              </Grid>
            </motion.div>
          </Box>
        </Container>
      </DashboardLayout>
    </DarkOverlay>
  );
};

export default SalesDashboard;
