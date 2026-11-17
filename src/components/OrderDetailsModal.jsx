import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBox, faUser, faXmark } from "@fortawesome/free-solid-svg-icons";
import StatusSelect from "./StatusSelect";
import { formatCurrency, formatDate, getProductOptions } from "../utils/adminHelpers";
import "./OrderDetailsModal.css";

export default function OrderDetailsModal({ order, onClose, pendingStatuses, updatingItems, setPendingStatuses, updateStatus }) {
  if (!order) return null;
  return (
    <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="admin-detail-modal" role="dialog" aria-modal="true" aria-labelledby="admin-order-modal-title">
        <div className="admin-modal-header">
          <div><span className="admin-eyebrow">ORDER DETAILS</span><h2 id="admin-order-modal-title">#{String(order._id).slice(-8).toUpperCase()}</h2></div>
          <button type="button" className="admin-icon-button" onClick={onClose} aria-label="Close order details"><FontAwesomeIcon icon={faXmark} /></button>
        </div>
        <div className="admin-modal-body">
          <div className="admin-detail-section">
            <h3><FontAwesomeIcon icon={faUser} /> Customer information</h3>
            <p><strong>Name:</strong> {order.customer?.name || "—"}</p>
            <p><strong>Phone:</strong> {order.customer?.phone || "—"}</p>
            <p><strong>Email:</strong> {order.customer?.email || "Not provided"}</p>
            <p><strong>Address:</strong> {[order.customer?.address, order.customer?.city, order.customer?.pincode].filter(Boolean).join(", ") || "—"}</p>
            {order.customer?.notes && <p><strong>Notes:</strong> {order.customer.notes}</p>}
          </div>
          <div className="admin-detail-section">
            <h3><FontAwesomeIcon icon={faBox} /> Ordered products</h3>
            {(order.items || []).map((item, index) => {
              const options = getProductOptions(item);
              const quantity = Number(item.quantity) || 0;
              const price = Number(item.price) || 0;
              const subtotal = item.subtotal ?? quantity * price;
              return (
                <div className="admin-order-product" key={`${item.productId || item.name}-${index}`}>
                  <div><strong>{item.name || "Product"}</strong>{options && <small>{options}</small>}<small>{quantity} × {formatCurrency(price)}</small></div>
                  <strong>{formatCurrency(subtotal)}</strong>
                </div>
              );
            })}
            <div className="admin-order-total"><span>Order total</span><strong>{formatCurrency(order.total)}</strong></div>
          </div>
          <div className="admin-detail-section">
            <h3>Order status</h3>
            <StatusSelect type="order" item={order} pendingStatuses={pendingStatuses} updatingItems={updatingItems} setPendingStatuses={setPendingStatuses} updateStatus={updateStatus} onSaved={onClose} />
            <p className="admin-detail-date">Placed on {formatDate(order.createdAt)}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
