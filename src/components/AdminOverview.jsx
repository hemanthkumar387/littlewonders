import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBox, faClock, faEnvelope, faIndianRupeeSign, faRotate, faEye } from "@fortawesome/free-solid-svg-icons";
import StatusBadge from "./shared/StatusBadge";
import RefreshButton from "./shared/RefreshButton";
import EmptyState from "./shared/EmptyState";
import { formatCurrency, formatDate } from "../utils/adminHelpers";
import "./AdminOverview.css";

export default function AdminOverview({ stats, orders, messages, loading, loadDashboard, navigateTo, setSelectedOrder, setSelectedMessage }) {
  const statCards = [
    { label: "Total orders", value: stats.totalOrders, note: "All recorded orders", icon: faBox, tone: "sage" },
    { label: "Pending orders", value: stats.pendingOrders, note: "Waiting for confirmation", icon: faClock, tone: "peach" },
    { label: "Unread messages", value: stats.unreadMessages, note: "Customer enquiries", icon: faEnvelope, tone: "lavender" },
    { label: "Order value", value: formatCurrency(stats.revenue), note: "Excludes cancelled orders", icon: faIndianRupeeSign, tone: "gold" },
  ];

  const formatSubject = (subject) => {
  if (!subject) return "—";

  return subject.replace(/^\[other\]\s*/i, "").trim();
};

  return (
    <>
      <div className="admin-page-intro admin-overview-intro">
        <div><span className="admin-eyebrow">YOUR STORE AT A GLANCE</span><h2>Welcome to your little wonders studio</h2></div>
        <RefreshButton onClick={loadDashboard} loading={loading} />
      </div>
      <div className="admin-welcome-banner">
        <div><h2>Every order tells a story.</h2><p>Keep track of your creations, customers, and the little details that make your store special.</p></div>
        <div className="admin-banner-decoration" aria-hidden="true">♡</div>
      </div>
      <div className="admin-stats-grid">
        {statCards.map((card) => (
          <article className="admin-stat-card" key={card.label}>
            <div className={`admin-stat-icon ${card.tone}`}><FontAwesomeIcon icon={card.icon} /></div>
            <span>{card.label}</span><strong>{card.value}</strong><small>{card.note}</small>
          </article>
        ))}
      </div>
      <div className="admin-section-heading">
        <div><span className="admin-eyebrow">THE LATEST</span><h2>Recent orders</h2></div>
        <button type="button" className="admin-text-button" onClick={() => navigateTo("orders")}>View all</button>
      </div>
      <div className="admin-table-card">
        {loading ? <EmptyState icon={faRotate} loading message="Loading your store data..." /> : orders.length === 0 ? <EmptyState icon={faBox} title="Your first order is on its way" message="Orders will appear here after customers check out." /> : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th>Details</th></tr></thead>
              <tbody>{orders.slice(0, 5).map((order) => (
                <tr key={order._id}>
                  <td><span className="admin-order-id">#{String(order._id).slice(-8).toUpperCase()}</span></td>
                  <td><strong>{order.customer?.name || "Customer"}</strong><small>{order.customer?.phone || "—"}</small></td>
                  <td>{formatDate(order.createdAt)}</td><td className="admin-money">{formatCurrency(order.total)}</td>
                  <td><StatusBadge status={order.status} /></td>
                  <td><button type="button" className="admin-icon-button" onClick={() => setSelectedOrder(order)} aria-label="View order details"><FontAwesomeIcon icon={faEye} /></button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
      <div className="admin-section-heading admin-message-heading">
        <div><span className="admin-eyebrow">FROM YOUR CUSTOMERS</span><h2>Latest messages</h2></div>
        <button type="button" className="admin-text-button" onClick={() => navigateTo("messages")}>View all</button>
      </div>
      <div className="admin-message-grid">
        {messages.length === 0 ? <EmptyState icon={faEnvelope} message="No customer messages yet." /> : messages.slice(0, 3).map((message) => (
          <button type="button" className="admin-message-card" key={message._id} onClick={() => setSelectedMessage(message)}>
            <div className="admin-message-card-top"><span className="admin-message-avatar">{(message.name || "C").charAt(0).toUpperCase()}</span><StatusBadge status={message.status} /></div>
            <strong>{message.name}</strong><span className="admin-message-subject">{formatSubject(message.subject)}</span><p>{message.message}</p><small>{formatDate(message.createdAt)}</small>
          </button>
        ))}
      </div>
    </>
  );
}
