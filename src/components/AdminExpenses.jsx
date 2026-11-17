import { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTrash,
  faWallet,
  faMoneyBillTransfer,
  faChartLine,
  faIndianRupeeSign,
  faFloppyDisk,
} from "@fortawesome/free-solid-svg-icons";

import { API_URL, getErrorMessage } from "../utils/adminHelpers";
import "./AdminExpenses.css";

const AdminExpenses = () => {
  const [formData, setFormData] = useState({
    itemName: "",
    price: "",
    person: "Hasini",
  });

  const [expenses, setExpenses] = useState([]);
  const [totalReceived, setTotalReceived] = useState("");
  const [savedReceived, setSavedReceived] = useState(0);

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [savingReceived, setSavingReceived] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = sessionStorage.getItem("littlewonders_admin_token") || "";

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
        sessionStorage.removeItem("littlewonders_admin_token");
        sessionStorage.removeItem("littlewonders_admin_username");
        window.location.reload();
        throw new Error("Your admin session has expired. Please log in again.");
      }

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      return response.json();
    },
    [token],
  );

  // Load saved expenses and received amount.
  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await apiRequest("/api/admin/expenses");

      setExpenses(Array.isArray(result.expenses) ? result.expenses : []);
      setTotalReceived(String(result.totalReceived ?? 0));
      setSavedReceived(Number(result.totalReceived) || 0);
    } catch (err) {
      setError(err.message || "Unable to load expenses.");
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Add expense to MongoDB.
  const addExpense = async (event) => {
    event.preventDefault();

    if (adding) return;

    setError("");
    setSuccess("");

    if (
      !formData.itemName.trim() ||
      !formData.price ||
      !Number.isFinite(Number(formData.price)) ||
      Number(formData.price) <= 0
    ) {
      setError("Please enter a valid item name and price.");
      return;
    }

    setAdding(true);

    try {
      const result = await apiRequest("/api/admin/expenses", {
        method: "POST",
        body: JSON.stringify({
          itemName: formData.itemName.trim(),
          price: Number(formData.price),
          person: formData.person,
        }),
      });

      setExpenses((previous) => [result.expense, ...previous]);

      setFormData({
        itemName: "",
        price: "",
        person: "Hasini",
      });

      setSuccess("Expense added successfully.");
    } catch (err) {
      setError(err.message || "Unable to add expense.");
    } finally {
      setAdding(false);
    }
  };

  // Delete expense from MongoDB.
  const deleteExpense = async (id) => {
    if (deletingId) return;

    setError("");
    setSuccess("");
    setDeletingId(id);

    try {
      await apiRequest(`/api/admin/expenses/${id}`, {
        method: "DELETE",
      });

      setExpenses((previous) =>
        previous.filter((expense) => expense._id !== id),
      );

      setSuccess("Expense deleted successfully.");
    } catch (err) {
      setError(err.message || "Unable to delete expense.");
    } finally {
      setDeletingId("");
    }
  };

  // Save received amount in MongoDB.
  const saveReceivedAmount = async () => {
    if (savingReceived) return;

    const amount = Number(totalReceived);

    if (
      totalReceived.trim() === "" ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > 1000000000
    ) {
      setError("Please enter a valid amount.");
      return;
    }

    setError("");
    setSuccess("");
    setSavingReceived(true);

    try {
      const result = await apiRequest("/api/admin/expenses/received", {
        method: "PATCH",
        body: JSON.stringify({
          amountToAdd: amount,
        }),
      });

      setSavedReceived(Number(result.totalReceived) || 0);

      // Clear the input after adding the amount.
      setTotalReceived("");

      setSuccess("Amount added successfully.");
    } catch (err) {
      setError(err.message || "Unable to add amount.");
    } finally {
      setSavingReceived(false);
    }
  };

  const totalSpent = useMemo(
    () =>
      expenses.reduce(
        (total, expense) => total + Number(expense.price || 0),
        0,
      ),
    [expenses],
  );

  const received = savedReceived;
  const profitOrLoss = received - totalSpent;
  const isProfit = profitOrLoss >= 0;

  const formatPrice = (amount) =>
    `₹${Number(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="expenses-page">
      <div className="expenses-heading">
        <div>
          <h2>Expenses</h2>
          <p>Track your spending and monitor your profits.</p>
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="admin-alert" role="status">
          <span>{success}</span>
          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      {/* Add Expense */}
      <section className="expense-form-section">
        <div className="expense-section-heading">
          <div className="expense-heading-icon">
            <FontAwesomeIcon icon={faPlus} />
          </div>

          <div>
            <h3>Add New Expense</h3>
            <p>Enter the details of your expense below.</p>
          </div>
        </div>

        <form className="expense-form" onSubmit={addExpense}>
          <div className="expense-input-group">
            <label htmlFor="expense-item">Item Name</label>
            <input
              id="expense-item"
              type="text"
              name="itemName"
              placeholder="Enter item name"
              value={formData.itemName}
              onChange={handleChange}
              maxLength={200}
              required
            />
          </div>

          <div className="expense-input-group">
            <label htmlFor="expense-price">Price (₹)</label>
            <input
              id="expense-price"
              type="number"
              name="price"
              placeholder="Enter price"
              min="0.01"
              max="10000000"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              required
            />
          </div>

          <div className="expense-input-group">
            <label htmlFor="expense-person">Name</label>
            <select
              id="expense-person"
              name="person"
              value={formData.person}
              onChange={handleChange}
            >
              <option value="Hasini">Hasini</option>
              <option value="Pravallika">Pravallika</option>
            </select>
          </div>

          <button
            type="submit"
            className="expense-add-button"
            disabled={adding || loading}
          >
            <FontAwesomeIcon icon={faPlus} />
            {adding ? "Adding..." : "Add Expense"}
          </button>
        </form>
      </section>

      {/* Expense History */}
      <section className="expense-history-section">
        <div className="expense-section-heading">
          <div className="expense-heading-icon">
            <FontAwesomeIcon icon={faWallet} />
          </div>

          <div>
            <h3>Expense History</h3>
            <p>{expenses.length} expense(s) recorded</p>
          </div>
        </div>

        {loading ? (
          <div className="expense-empty-state">
            <p>Loading expenses...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="expense-empty-state">
            <FontAwesomeIcon icon={faWallet} />
            <h4>No expenses added yet</h4>
            <p>Your saved expenses will appear here.</p>
          </div>
        ) : (
          <div className="expense-table-wrapper">
            <table className="expense-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Price</th>
                  <th>Name</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense._id}>
                    <td className="expense-item-name">{expense.itemName}</td>

                    <td className="expense-price">
                      {formatPrice(expense.price)}
                    </td>

                    <td>
                      <span
                        className={`expense-person expense-person-${expense.person.toLowerCase()}`}
                      >
                        {expense.person}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="expense-delete-button"
                        onClick={() => deleteExpense(expense._id)}
                        disabled={deletingId === expense._id}
                        aria-label={`Delete ${expense.itemName}`}
                        title="Delete expense"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Financial Summary */}
      <section className="expense-summary-section">
        <div className="expense-summary-heading">
          <h3>Financial Summary</h3>
          <p>Check your total received, spending and final balance.</p>
        </div>

        <div className="expense-received-input">
          <label htmlFor="total-received">Add Amount Received (₹)</label>

          <div className="expense-received-controls">
            <input
              id="total-received"
              type="number"
              min="0"
              max="1000000000"
              step="0.01"
              placeholder="Enter amount to add"
              value={totalReceived}
              onChange={(event) => setTotalReceived(event.target.value)}
            />

            <button
              type="button"
              className="expense-save-button"
              onClick={saveReceivedAmount}
              disabled={
                savingReceived ||
                loading ||
                totalReceived.trim() === "" ||
                Number(totalReceived) <= 0
              }
            >
              <FontAwesomeIcon icon={faFloppyDisk} />
              {savingReceived ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div className="expense-summary-cards">
          <div className="expense-summary-card received-card">
            <div className="expense-summary-card-top">
              <span>Total Amount Received</span>
              <div className="expense-summary-icon">
                <FontAwesomeIcon icon={faIndianRupeeSign} />
              </div>
            </div>

            <h2>{formatPrice(received)}</h2>
          </div>

          <div className="expense-summary-card spent-card">
            <div className="expense-summary-card-top">
              <span>Total Amount Spent</span>
              <div className="expense-summary-icon">
                <FontAwesomeIcon icon={faMoneyBillTransfer} />
              </div>
            </div>

            <h2>{formatPrice(totalSpent)}</h2>
          </div>

          <div
            className={`expense-summary-card ${
              isProfit ? "profit-card" : "loss-card"
            }`}
          >
            <div className="expense-summary-card-top">
              <span>{isProfit ? "Net Profit" : "Net Loss"}</span>

              <div className="expense-summary-icon">
                <FontAwesomeIcon icon={faChartLine} />
              </div>
            </div>

            <h2>
              {isProfit ? "" : "-"}
              {formatPrice(Math.abs(profitOrLoss))}
            </h2>

            <span className="expense-summary-caption">
              {isProfit ? "You're making a profit!" : "Expenses exceed income."}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminExpenses;
