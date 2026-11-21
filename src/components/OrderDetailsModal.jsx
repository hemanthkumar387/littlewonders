
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBox,
  faUser,
  faXmark,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";

import StatusSelect from "./StatusSelect";
import {
  formatCurrency,
  formatDate,
  getProductOptions,
} from "../utils/adminHelpers";

import "./OrderDetailsModal.css";

export default function OrderDetailsModal({
  order,
  onClose,
  pendingStatuses,
  updatingItems,
  setPendingStatuses,
  updateStatus,
  updatePayment,
}) {
  const [paymentStatus, setPaymentStatus] = useState("Unpaid");
  const [amountPaid, setAmountPaid] = useState("0");

  const orderTotal = Number(order?.total) || 0;
  const paidAmount = amountPaid === "" ? 0 : Number(amountPaid);
  const remainingAmount = Math.max(0, orderTotal - paidAmount);

  const paymentKey = order ? `payment-${order._id}` : "";
  const isPaymentUpdating = Boolean(updatingItems?.[paymentKey]);

  useEffect(() => {
    if (!order) return;

    setPaymentStatus(order.paymentStatus || "Unpaid");
    setAmountPaid(String(Number(order.amountPaid) || 0));
  }, [order?._id]);

  if (!order) return null;

  const savedPaymentStatus = order.paymentStatus || "Unpaid";
  const savedAmountPaid = Number(order.amountPaid) || 0;

  const paymentChanged =
    paymentStatus !== savedPaymentStatus ||
    paidAmount !== savedAmountPaid;

  const isValidAmount =
    amountPaid !== "" &&
    Number.isFinite(paidAmount) &&
    paidAmount >= 0 &&
    paidAmount <= orderTotal;

  const getPaymentStatus = (amount) => {
    if (amount <= 0) return "Unpaid";
    if (amount >= orderTotal) return "Paid";
    return "Partially Paid";
  };

  const handleAmountChange = (value) => {
    if (value === "") {
      setAmountPaid("");
      return;
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue < 0) {
      return;
    }

    setAmountPaid(value);

    if (numericValue <= orderTotal) {
      setPaymentStatus(getPaymentStatus(numericValue));
    }
  };

  const handlePaymentStatusChange = (status) => {
    setPaymentStatus(status);

    if (status === "Unpaid") {
      setAmountPaid("0");
    } else if (status === "Paid") {
      setAmountPaid(String(orderTotal));
    } else if (status === "Partially Paid") {
      const currentAmount = Number(amountPaid) || 0;

      if (currentAmount <= 0 || currentAmount >= orderTotal) {
        setAmountPaid(String(orderTotal > 1 ? 1 : 0.5));
      }
    }
  };

  const handlePaymentCancel = () => {
    setPaymentStatus(savedPaymentStatus);
    setAmountPaid(String(savedAmountPaid));
  };

  const handlePaymentSave = async () => {
    if (!isValidAmount || orderTotal <= 0) return;

    if (typeof updatePayment !== "function") {
      console.error("updatePayment function is not connected.");
      return;
    }

    const finalStatus = getPaymentStatus(paidAmount);

    const success = await updatePayment(
      order._id,
      finalStatus,
      paidAmount
    );

    if (success) {
      setPaymentStatus(finalStatus);
      setAmountPaid(String(paidAmount));
    }
  };

  return (
    <div
      className="admin-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="admin-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-order-modal-title"
      >
        {/* Modal Header */}
        <div className="admin-modal-header">
          <div>
            <span className="admin-eyebrow">ORDER DETAILS</span>
            <h2 id="admin-order-modal-title">
              #{String(order._id).slice(-8).toUpperCase()}
            </h2>
          </div>

          <button
            type="button"
            className="admin-icon-button"
            onClick={onClose}
            aria-label="Close order details"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="admin-modal-body">
          {/* Customer Information */}
          <div className="admin-detail-section">
            <h3>
              <FontAwesomeIcon icon={faUser} />
              Customer information
            </h3>

            <p>
              <strong>Name:</strong> {order.customer?.name || "—"}
            </p>

            <p>
              <strong>Phone:</strong> {order.customer?.phone || "—"}
            </p>

            <p>
              <strong>Email:</strong>{" "}
              {order.customer?.email || "Not provided"}
            </p>

            <p>
              <strong>Address:</strong>{" "}
              {[
                order.customer?.address,
                order.customer?.city,
                order.customer?.pincode,
              ]
                .filter(Boolean)
                .join(", ") || "—"}
            </p>

            {order.customer?.notes && (
              <p>
                <strong>Notes:</strong> {order.customer.notes}
              </p>
            )}
          </div>

          {/* Ordered Products */}
          <div className="admin-detail-section admin-products-section">
            <h3>
              <FontAwesomeIcon icon={faBox} />
              Ordered products
            </h3>

            {(order.items || []).map((item, index) => {
              const options = getProductOptions(item);
              const quantity = Number(item.quantity) || 0;
              const price = Number(item.price) || 0;
              const subtotal = item.subtotal ?? quantity * price;

              return (
                <div
                  className="admin-order-product"
                  key={`${item.productId || item.name}-${index}`}
                >
                  <div>
                    <strong>{item.name || "Product"}</strong>

                    {options && <small>{options}</small>}

                    <small>
                      {quantity} × {formatCurrency(price)}
                    </small>
                  </div>

                  <strong>{formatCurrency(subtotal)}</strong>
                </div>
              );
            })}

            <div className="admin-order-total">
              <span>Order total</span>
              <strong>{formatCurrency(orderTotal)}</strong>
            </div>
          </div>

          {/* Payment Details */}
          <div className="admin-detail-section admin-payment-section">
            <h3>
              <FontAwesomeIcon icon={faWallet} />
              Payment details
            </h3>

            <div className="admin-payment-row">
              <span>Order amount</span>
              <strong>{formatCurrency(orderTotal)}</strong>
            </div>

            <div className="admin-payment-field">
              <label htmlFor="admin-payment-status">
                Payment status
              </label>

              <select
                id="admin-payment-status"
                value={paymentStatus}
                onChange={(event) =>
                  handlePaymentStatusChange(event.target.value)
                }
                disabled={isPaymentUpdating}
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            <div className="admin-payment-field">
              <label htmlFor="admin-payment-amount">
                Amount received
              </label>

              <input
                id="admin-payment-amount"
                type="number"
                min="0"
                max={orderTotal}
                step="0.01"
                value={amountPaid}
                onChange={(event) =>
                  handleAmountChange(event.target.value)
                }
                disabled={isPaymentUpdating}
                placeholder="Enter amount received"
              />
            </div>

            <div className="admin-payment-row admin-payment-balance">
              <span>Remaining balance</span>
              <strong>{formatCurrency(remainingAmount)}</strong>
            </div>

            {!isValidAmount && (
              <p className="admin-payment-error">
                Enter an amount between 0 and {formatCurrency(orderTotal)}.
              </p>
            )}

            <div className="admin-payment-actions">
              <button
                type="button"
                className="admin-payment-cancel"
                onClick={handlePaymentCancel}
                disabled={!paymentChanged || isPaymentUpdating}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-payment-save"
                onClick={handlePaymentSave}
                disabled={
                  !paymentChanged ||
                  !isValidAmount ||
                  isPaymentUpdating ||
                  orderTotal <= 0
                }
              >
                {isPaymentUpdating ? "Saving..." : "Save Payment"}
              </button>
            </div>
          </div>

          {/* Order Status */}
          <div className="admin-detail-section">
            <h3>Order status</h3>

            <StatusSelect
              type="order"
              item={order}
              pendingStatuses={pendingStatuses}
              updatingItems={updatingItems}
              setPendingStatuses={setPendingStatuses}
              updateStatus={updateStatus}
              onSaved={onClose}
            />

            <p className="admin-detail-date">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
