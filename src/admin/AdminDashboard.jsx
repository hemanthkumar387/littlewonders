
import { useCallback, useEffect, useMemo, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faHeart } from "@fortawesome/free-solid-svg-icons";

import "./AdminDashboard.css";
import "./AdminDashboard.shared.css";

import AdminLogin from "../components/AdminLogin";
import AdminSidebar from "../components/AdminSidebar";
import AdminTopbar from "../components/AdminTopbar";
import AdminOverview from "../components/AdminOverview";
import AdminOrders from "../components/AdminOrders";
import AdminMessages from "../components/AdminMessages";
import OrderDetailsModal from "../components/OrderDetailsModal";
import MessageDetailsModal from "../components/MessageDetailsModal";
import AdminExpenses from "../components/AdminExpenses";
import Review from "../components/ReviewManagement";

import { API_URL, getErrorMessage } from "../utils/adminHelpers";

const AdminDashboard = () => {
  // ==================== AUTHENTICATION STATE ====================

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");

  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // ==================== DASHBOARD STATE ====================

  const [activeTab, setActiveTab] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  // ==================== SEARCH AND FILTER STATE ====================

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // ==================== UPDATE AND MODAL STATE ====================

  const [updatingItems, setUpdatingItems] = useState({});
  const [pendingStatuses, setPendingStatuses] = useState({});

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // ==================== LOGOUT ====================

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/admin/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Admin logout error:", error);
    }

    setIsAuthenticated(false);
    setUsername("");

    setOrders([]);
    setMessages([]);
    setReviews([]);

    setSelectedOrder(null);
    setSelectedMessage(null);

    setPendingStatuses({});
    setUpdatingItems({});

    setLoginForm({
      username: "",
      password: "",
    });

    setLoginError("");
    setPageError("");

    setActiveTab("overview");
    setSearch("");
    setStatusFilter("All");

    window.location.href = "/admin";
  }, []);

  // ==================== COMMON AUTHENTICATED API REQUEST ====================

  const apiRequest = useCallback(
    async (endpoint, options = {}) => {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });

      if (response.status === 401 || response.status === 403) {
        void logout();

        throw new Error(
          "Your admin session has expired. Please log in again."
        );
      }

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      return response.json();
    },
    [logout]
  );

  // ==================== ADMIN LOGIN ====================

  const handleLogin = async (event) => {
    event.preventDefault();

    if (loginLoading) return;

    setLoginLoading(true);
    setLoginError("");

    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginForm),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Invalid username or password."
        );
      }

      // The backend stores the JWT in the HTTP-only adminToken cookie.
      // No JWT is stored in localStorage or sessionStorage.

      setUsername(result.username || loginForm.username);
      setIsAuthenticated(true);

      setLoginForm({
        username: "",
        password: "",
      });

      setLoginError("");

      // window.location.href = "/dashboard";
    } catch (error) {
      setLoginError(
        error.message || "Unable to sign in. Please try again."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // ==================== LOAD DASHBOARD DATA ====================

  const loadDashboard = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setPageError("");

    try {
      const [orderResult, messageResult, reviewResult] =
        await Promise.all([
          apiRequest("/api/admin/orders"),
          apiRequest("/api/admin/messages"),
          apiRequest("/api/admin/reviews"),
        ]);

      setOrders(
        Array.isArray(orderResult.orders)
          ? orderResult.orders
          : []
      );

      setMessages(
        Array.isArray(messageResult.messages)
          ? messageResult.messages
          : []
      );

      setReviews(
        Array.isArray(reviewResult.reviews)
          ? reviewResult.reviews
          : []
      );
    } catch (error) {
      setPageError(
        error.message || "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, apiRequest]);

  // Automatically load dashboard data after authentication.
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) {
        void loadDashboard();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, loadDashboard]);

  // ==================== REFRESH REVIEWS ====================

  const refreshReviews = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const result = await apiRequest("/api/admin/reviews");

      setReviews(
        Array.isArray(result.reviews)
          ? result.reviews
          : []
      );
    } catch (error) {
      console.error("Unable to refresh reviews:", error);
    }
  }, [isAuthenticated, apiRequest]);

  // Refresh reviews every 30 seconds.
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const interval = setInterval(() => {
      void refreshReviews();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshReviews]);

  // ==================== KEEP SAVE/CANCEL BUTTONS VISIBLE ====================

  useEffect(() => {
    const pendingKeys = Object.keys(pendingStatuses);

    if (pendingKeys.length === 0) return undefined;

    const latestKey = pendingKeys[pendingKeys.length - 1];

    const frame = window.requestAnimationFrame(() => {
      const actionRows = document.querySelectorAll(
        ".admin-status-actions[data-status-key]"
      );

      const target = Array.from(actionRows).find(
        (element) => element.dataset.statusKey === latestKey
      );

      target?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pendingStatuses]);

  // ==================== UPDATE ORDER / MESSAGE STATUS ====================

  const updateStatus = async (type, id, status) => {
    const key = `${type}-${id}`;

    setUpdatingItems((previous) => ({
      ...previous,
      [key]: true,
    }));

    setPageError("");

    try {
      if (type === "order") {
        await apiRequest(`/api/admin/orders/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });

        setOrders((previous) =>
          previous.map((order) =>
            order._id === id
              ? { ...order, status }
              : order
          )
        );

        setSelectedOrder((previous) =>
          previous?._id === id
            ? { ...previous, status }
            : previous
        );
      } else {
        await apiRequest(`/api/admin/messages/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });

        setMessages((previous) =>
          previous.map((message) =>
            message._id === id
              ? { ...message, status }
              : message
          )
        );

        setSelectedMessage((previous) =>
          previous?._id === id
            ? { ...previous, status }
            : previous
        );
      }

      setPendingStatuses((previous) => {
        const next = { ...previous };
        delete next[key];
        return next;
      });

      return true;
    } catch (error) {
      setPageError(
        error.message || "Unable to update status."
      );

      return false;
    } finally {
      setUpdatingItems((previous) => ({
        ...previous,
        [key]: false,
      }));
    }
  };

  // ==================== UPDATE ORDER PAYMENT ====================

  const updatePayment = async (id, paymentStatus, amountPaid) => {
    const key = `payment-${id}`;

    setUpdatingItems((previous) => ({
      ...previous,
      [key]: true,
    }));

    setPageError("");

    try {
      const result = await apiRequest(
        `/api/admin/orders/${id}/payment`,
        {
          method: "PATCH",
          body: JSON.stringify({
            paymentStatus,
            amountPaid,
          }),
        }
      );

      const updatedPayment = {
        paymentStatus:
          result.order?.paymentStatus || paymentStatus,
        amountPaid: Number(
          result.order?.amountPaid ?? amountPaid
        ),
      };

      setOrders((previous) =>
        previous.map((order) =>
          order._id === id
            ? { ...order, ...updatedPayment }
            : order
        )
      );

      setSelectedOrder((previous) =>
        previous?._id === id
          ? { ...previous, ...updatedPayment }
          : previous
      );

      return true;
    } catch (error) {
      setPageError(
        error.message || "Unable to update payment details."
      );

      return false;
    } finally {
      setUpdatingItems((previous) => ({
        ...previous,
        [key]: false,
      }));
    }
  };

  // ==================== DASHBOARD STATISTICS ====================

  const stats = useMemo(() => {
    const revenue = orders
      .filter((order) => order.status !== "Cancelled")
      .reduce(
        (sum, order) => sum + (Number(order.total) || 0),
        0
      );

    return {
      totalOrders: orders.length,

      pendingOrders: orders.filter(
        (order) =>
          !["Completed", "Cancelled"].includes(order.status)
      ).length,

      unreadMessages: messages.filter(
        (message) => message.status === "Unread"
      ).length,

      revenue,
    };
  }, [orders, messages]);

  // ==================== FILTER ORDERS ====================

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const customer = order.customer || {};

      const values = [
        order._id,
        customer.name,
        customer.phone,
        customer.email,
        customer.city,
        customer.pincode,
        ...(order.items || []).map((item) => item.name),
      ];

      const matchesSearch =
        !query ||
        values
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(query)
          );

      return (
        matchesSearch &&
        (statusFilter === "All" ||
          order.status === statusFilter)
      );
    });
  }, [orders, search, statusFilter]);

  // ==================== FILTER MESSAGES ====================

  const filteredMessages = useMemo(() => {
    const query = search.trim().toLowerCase();

    return messages.filter((message) => {
      const values = [
        message.name,
        message.phone,
        message.email,
        message.subject,
        message.message,
      ];

      const matchesSearch =
        !query ||
        values
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(query)
          );

      return (
        matchesSearch &&
        (statusFilter === "All" ||
          message.status === statusFilter)
      );
    });
  }, [messages, search, statusFilter]);

  // ==================== DASHBOARD NAVIGATION ====================

  const navigateTo = (tab) => {
    setActiveTab(tab);
    setSearch("");
    setStatusFilter("All");
    setMobileMenuOpen(false);
    setSelectedOrder(null);
    setSelectedMessage(null);
    setPageError("");
  };

  // ==================== LOGIN PAGE ====================

  if (!isAuthenticated) {
    return (
      <AdminLogin
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        loginLoading={loginLoading}
        loginError={loginError}
        handleLogin={handleLogin}
      />
    );
  }

  // ==================== ADMIN DASHBOARD ====================

  return (
    <main className="admin-shell">
      <AdminSidebar
        activeTab={activeTab}
        navigateTo={navigateTo}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        stats={stats}
        logout={logout}
      />

      <section className="admin-main">
        <AdminTopbar
          activeTab={activeTab}
          username={username}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        <div className="admin-content">
          {pageError && (
            <div
              className="admin-alert admin-alert-error"
              role="alert"
            >
              <span>{pageError}</span>

              <button
                type="button"
                onClick={() => setPageError("")}
                aria-label="Dismiss error"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          )}

          {activeTab === "overview" && (
            <AdminOverview
              stats={stats}
              orders={orders}
              messages={messages}
              loading={loading}
              loadDashboard={loadDashboard}
              navigateTo={navigateTo}
              setSelectedOrder={setSelectedOrder}
              setSelectedMessage={setSelectedMessage}
            />
          )}

          {activeTab === "orders" && (
            <AdminOrders
              orders={orders}
              filteredOrders={filteredOrders}
              loading={loading}
              loadDashboard={loadDashboard}
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              pendingStatuses={pendingStatuses}
              updatingItems={updatingItems}
              setPendingStatuses={setPendingStatuses}
              updateStatus={updateStatus}
              setSelectedOrder={setSelectedOrder}
            />
          )}

          {activeTab === "messages" && (
            <AdminMessages
              messages={messages}
              filteredMessages={filteredMessages}
              loading={loading}
              loadDashboard={loadDashboard}
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              pendingStatuses={pendingStatuses}
              updatingItems={updatingItems}
              setPendingStatuses={setPendingStatuses}
              updateStatus={updateStatus}
              setSelectedMessage={setSelectedMessage}
            />
          )}

          {activeTab === "expenses" && (
            <AdminExpenses />
          )}

          {activeTab === "reviews" && (
            <Review
              reviews={reviews}
              setReviews={setReviews}
              loading={loading}
              loadDashboard={loadDashboard}
              apiRequest={apiRequest}
            />
          )}

          <footer className="admin-footer">
            <span>
              <FontAwesomeIcon icon={faHeart} /> LittleWonders, made with care.
            </span>

            <span>Store administration</span>
          </footer>
        </div>
      </section>

      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        pendingStatuses={pendingStatuses}
        updatingItems={updatingItems}
        setPendingStatuses={setPendingStatuses}
        updateStatus={updateStatus}
        updatePayment={updatePayment}
      />

      <MessageDetailsModal
        message={selectedMessage}
        onClose={() => setSelectedMessage(null)}
        pendingStatuses={pendingStatuses}
        updatingItems={updatingItems}
        setPendingStatuses={setPendingStatuses}
        updateStatus={updateStatus}
      />
    </main>
  );
};

export default AdminDashboard;
