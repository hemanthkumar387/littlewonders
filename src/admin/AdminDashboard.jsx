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
import { API_URL, getErrorMessage } from "../utils/adminHelpers";

const AdminDashboard = () => {
  // Authentication state
  const [token, setToken] = useState(
    () => sessionStorage.getItem("littlewonders_admin_token") || "",
  );
  const [username, setUsername] = useState(
    () => sessionStorage.getItem("littlewonders_admin_username") || "",
  );
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Dashboard navigation and data
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  // Search, filters, status changes and detail popups
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [updatingItems, setUpdatingItems] = useState({});
  const [pendingStatuses, setPendingStatuses] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Keep the Save/Cancel actions visible when a status is changed.
  useEffect(() => {
    const pendingKeys = Object.keys(pendingStatuses);
    if (pendingKeys.length === 0) return undefined;
    const latestKey = pendingKeys[pendingKeys.length - 1];
    const frame = window.requestAnimationFrame(() => {
      const actionRows = document.querySelectorAll(
        ".admin-status-actions[data-status-key]",
      );
      const target = Array.from(actionRows).find(
        (element) => element.dataset.statusKey === latestKey,
      );
      target?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pendingStatuses]);

  const logout = useCallback(() => {
    sessionStorage.removeItem("littlewonders_admin_token");
    sessionStorage.removeItem("littlewonders_admin_username");
    setToken("");
    setUsername("");
    setOrders([]);
    setMessages([]);
    setSelectedOrder(null);
    setSelectedMessage(null);
    setPendingStatuses({});
    setLoginForm({ username: "", password: "" });
    setPageError("");
    setActiveTab("overview");
  }, []);

  const apiRequest = useCallback(
    async (endpoint, options = {}) => {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (response.status === 401 || response.status === 403) {
        logout();
        throw new Error("Your admin session has expired. Please log in again.");
      }
      if (!response.ok) throw new Error(await getErrorMessage(response));
      return response.json();
    },
    [token, logout],
  );

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setPageError("");
    try {
      const [orderResult, messageResult] = await Promise.all([
        apiRequest("/api/admin/orders"),
        apiRequest("/api/admin/messages"),
      ]);
      setOrders(Array.isArray(orderResult.orders) ? orderResult.orders : []);
      setMessages(
        Array.isArray(messageResult.messages) ? messageResult.messages : [],
      );
    } catch (error) {
      setPageError(error.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [token, apiRequest]);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) void loadDashboard();
    });
    return () => {
      cancelled = true;
    };
  }, [token, loadDashboard]);

  const handleLogin = async (event) => {
    event.preventDefault();
    if (loginLoading) return;
    setLoginError("");
    if (!loginForm.username.trim() || !loginForm.password) {
      setLoginError("Enter your admin username and password.");
      return;
    }
    setLoginLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginForm.username.trim(),
          password: loginForm.password,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success || !result.token)
        throw new Error(result.message || "Unable to log in.");
      const loggedInUsername = result.username || loginForm.username.trim();
      sessionStorage.setItem("littlewonders_admin_token", result.token);
      sessionStorage.setItem("littlewonders_admin_username", loggedInUsername);
      setToken(result.token);
      setUsername(loggedInUsername);
      setLoginForm({ username: "", password: "" });
    } catch (error) {
      setLoginError(
        error.message || "Login failed. Please check your connection.",
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const updateStatus = async (type, id, status) => {
    const key = `${type}-${id}`;
    setUpdatingItems((previous) => ({ ...previous, [key]: true }));
    setPageError("");
    try {
      if (type === "order") {
        await apiRequest(`/api/admin/orders/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
        setOrders((previous) =>
          previous.map((order) =>
            order._id === id ? { ...order, status } : order,
          ),
        );
        setSelectedOrder((previous) =>
          previous?._id === id ? { ...previous, status } : previous,
        );
      } else {
        await apiRequest(`/api/admin/messages/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
        setMessages((previous) =>
          previous.map((message) =>
            message._id === id ? { ...message, status } : message,
          ),
        );
        setSelectedMessage((previous) =>
          previous?._id === id ? { ...previous, status } : previous,
        );
      }
      setPendingStatuses((previous) => {
        const next = { ...previous };
        delete next[key];
        return next;
      });
      return true;
    } catch (error) {
      setPageError(error.message || "Unable to update status.");
      return false;
    } finally {
      setUpdatingItems((previous) => ({ ...previous, [key]: false }));
    }
  };

  const stats = useMemo(() => {
    const revenue = orders
      .filter((order) => order.status !== "Cancelled")
      .reduce((sum, order) => sum + (Number(order.total) || 0), 0);

    return {
      totalOrders: orders.length,
      pendingOrders: orders.filter((order) => !["Completed", "Cancelled"].includes(order.status))
        .length,
      unreadMessages: messages.filter((message) => message.status === "Unread")
        .length,
      revenue,
    };
  }, [orders, messages]);

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
          .some((value) => String(value).toLowerCase().includes(query));
      return (
        matchesSearch &&
        (statusFilter === "All" || order.status === statusFilter)
      );
    });
  }, [orders, search, statusFilter]);

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
          .some((value) => String(value).toLowerCase().includes(query));
      return (
        matchesSearch &&
        (statusFilter === "All" || message.status === statusFilter)
      );
    });
  }, [messages, search, statusFilter]);

  const navigateTo = (tab) => {
    setActiveTab(tab);
    setSearch("");
    setStatusFilter("All");
    setMobileMenuOpen(false);
    setSelectedOrder(null);
    setSelectedMessage(null);
    setPageError("");
  };

  if (!token) {
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
            <div className="admin-alert admin-alert-error" role="alert">
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

          {activeTab === "expenses" && <AdminExpenses />}

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
