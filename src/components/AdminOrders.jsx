import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBox, faMagnifyingGlass, faRotate, faEye } from "@fortawesome/free-solid-svg-icons";
import RefreshButton from "./shared/RefreshButton";
import EmptyState from "./shared/EmptyState";
import StatusBadge from "./shared/StatusBadge";
import { ORDER_STATUSES, formatCurrency, formatDate } from "../utils/adminHelpers";
import "./AdminOrders.css";

export default function AdminOrders({ orders, filteredOrders, loading, loadDashboard, search, setSearch, statusFilter, setStatusFilter, setSelectedOrder }) {
  return (
    <>
      <div className="admin-page-intro"><div><span className="admin-eyebrow">EVERY ORDER MATTERS</span><h2>All orders</h2><p>Review purchases and keep customers updated.</p></div><RefreshButton onClick={loadDashboard} loading={loading} /></div>
      <div className="admin-toolbar">
        <div className="admin-search"><FontAwesomeIcon icon={faMagnifyingGlass} /><input type="search" placeholder="Search name, phone, product or order ID..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <select className="admin-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter orders by status">
          <option value="All">All statuses</option>{ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </div>
      <div className="admin-results-count">Showing {filteredOrders.length} of {orders.length} orders</div>
      <div className="admin-table-card">
        {loading ? <EmptyState icon={faRotate} loading message="Loading orders..." /> : filteredOrders.length === 0 ? <EmptyState icon={faBox} title="No matching orders" message="Try a different search or status filter." /> : (
          <div className="admin-table-scroll"><table className="admin-table">
            <thead><tr><th>Order</th><th>Customer</th><th>Products</th><th>Date</th><th>Total</th><th>Status</th><th>View</th></tr></thead>
            <tbody>{filteredOrders.map((order) => (
              <tr key={order._id}>
                <td><span className="admin-order-id">#{String(order._id).slice(-8).toUpperCase()}</span></td>
                <td><strong>{order.customer?.name || "Customer"}</strong><small>{order.customer?.phone || "—"}</small></td>
                <td><strong>{order.items?.length || 0} {(order.items?.length || 0) === 1 ? "item" : "items"}</strong><small>{(order.items || []).slice(0, 2).map((item) => item.name).join(", ")}</small></td>
                <td>{formatDate(order.createdAt)}</td><td className="admin-money">{formatCurrency(order.total)}</td><td><StatusBadge status={order.status} /></td>
                <td><button type="button" className="admin-icon-button" onClick={() => setSelectedOrder(order)} aria-label="View order details"><FontAwesomeIcon icon={faEye} /></button></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </>
  );
}
