
import { useCallback, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faHeart,
  faCheck,
  faXmark,
  faTrash,
  faRotate,
  faMagnifyingGlass,
  faMessage,
  faClock,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import "./ReviewManagement.css";

const ReviewManagement = ({
  reviews = [],
  setReviews,
  loading = false,
  loadDashboard,
  apiRequest,
}) => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Refresh reviews using the dashboard's authenticated API request.
  const fetchReviews = useCallback(async () => {
    if (!loadDashboard) {
      toast.error("Unable to refresh reviews.");
      return;
    }

    await loadDashboard();
  }, [loadDashboard]);

  // Review statistics
  const stats = useMemo(() => {
    const pending = reviews.filter(
      (review) => review.status === "Pending",
    ).length;

    const approved = reviews.filter(
      (review) => review.status === "Approved",
    ).length;

    const rejected = reviews.filter(
      (review) => review.status === "Rejected",
    ).length;

    const approvedReviews = reviews.filter(
      (review) => review.status === "Approved",
    );

    const average = approved
      ? (
          approvedReviews.reduce(
            (sum, review) => sum + (Number(review.rating) || 0),
            0,
          ) / approved
        ).toFixed(1)
      : "0.0";

    return {
      total: reviews.length,
      pending,
      approved,
      rejected,
      average,
    };
  }, [reviews]);

  // Search and filter
  const filteredReviews = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return reviews.filter((review) => {
      const matchesFilter =
        activeFilter === "All" ||
        review.status?.toLowerCase() === activeFilter.toLowerCase();

      const matchesSearch =
        !search ||
        review.name?.toLowerCase().includes(search) ||
        review.product?.toLowerCase().includes(search) ||
        review.message?.toLowerCase().includes(search);

      return matchesFilter && matchesSearch;
    });
  }, [reviews, activeFilter, searchTerm]);

  // Update review status
  const handleStatusChange = async (reviewId, status) => {
    if (!reviewId || !apiRequest) {
      toast.error("Unable to update review.");
      return;
    }

    try {
      setUpdatingId(reviewId);

      const data = await apiRequest(
        `/api/admin/reviews/${reviewId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
      );

      if (!data.success) {
        throw new Error(data.message || "Unable to update review.");
      }

      setReviews((current) =>
        current.map((review) =>
          review._id === reviewId
            ? { ...review, ...(data.review || {}), status }
            : review,
        ),
      );

      toast.success(`Review ${status.toLowerCase()} successfully.`);
    } catch (error) {
      console.error("Review status update error:", error);
      toast.error(error.message || "Unable to update review.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete review
  const handleDelete = async () => {
    if (!confirmDelete?._id || !apiRequest) return;

    const reviewId = confirmDelete._id;

    try {
      setDeletingId(reviewId);

      const data = await apiRequest(
        `/api/admin/reviews/${reviewId}`,
        {
          method: "DELETE",
        },
      );

      if (!data.success) {
        throw new Error(data.message || "Unable to delete review.");
      }

      setReviews((current) =>
        current.filter((review) => review._id !== reviewId),
      );

      setConfirmDelete(null);
      toast.success("Review deleted successfully.");
    } catch (error) {
      console.error("Delete review error:", error);
      toast.error(error.message || "Unable to delete review.");
    } finally {
      setDeletingId(null);
    }
  };

  // Format review date
  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Render rating stars
  const renderStars = (rating) => (
    <div className="rm-stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <FontAwesomeIcon
          key={star}
          icon={faStar}
          className={star <= rating ? "filled" : "empty"}
        />
      ))}
    </div>
  );

  const filters = [
    { label: "All", count: stats.total },
    { label: "Pending", count: stats.pending },
    { label: "Approved", count: stats.approved },
    { label: "Rejected", count: stats.rejected },
  ];

  return (
    <div className="rm-page">
      {/* Header */}
      <div className="rm-header">
        <div>
          <span className="rm-eyebrow">
            <FontAwesomeIcon icon={faHeart} />
            LITTLEWONDERS ADMIN
          </span>

          <h1>Customer Reviews</h1>
          <p>Manage customer feedback and share their happy moments.</p>
        </div>

        <button
          type="button"
          className="rm-refresh-button"
          onClick={fetchReviews}
          disabled={loading}
        >
          <FontAwesomeIcon icon={faRotate} spin={loading} />
          Refresh
        </button>
      </div>

      {/* Statistics */}
      <div className="rm-stats-grid">
        <div className="rm-stat-card">
          <div className="rm-stat-icon rm-stat-icon-total">
            <FontAwesomeIcon icon={faMessage} />
          </div>

          <div>
            <span>Total Reviews</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="rm-stat-card">
          <div className="rm-stat-icon rm-stat-icon-pending">
            <FontAwesomeIcon icon={faClock} />
          </div>

          <div>
            <span>Pending</span>
            <strong>{stats.pending}</strong>
          </div>
        </div>

        <div className="rm-stat-card">
          <div className="rm-stat-icon rm-stat-icon-approved">
            <FontAwesomeIcon icon={faCircleCheck} />
          </div>

          <div>
            <span>Approved</span>
            <strong>{stats.approved}</strong>
          </div>
        </div>

        <div className="rm-stat-card">
          <div className="rm-stat-icon rm-stat-icon-rating">
            <FontAwesomeIcon icon={faStar} />
          </div>

          <div>
            <span>Average Rating</span>
            <strong>{stats.average} / 5</strong>
          </div>
        </div>
      </div>

      {/* Review management */}
      <section className="rm-content">
        <div className="rm-content-heading">
          <div>
            <h2>Manage Feedback</h2>
            <p>Review submissions and control what appears publicly.</p>
          </div>

          <div className="rm-search">
            <FontAwesomeIcon icon={faMagnifyingGlass} />

            <input
              type="search"
              placeholder="Search customer or product..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="rm-filters">
          {filters.map((filter) => (
            <button
              key={filter.label}
              type="button"
              className={activeFilter === filter.label ? "active" : ""}
              onClick={() => setActiveFilter(filter.label)}
            >
              {filter.label}
              <span>{filter.count}</span>
            </button>
          ))}
        </div>

        {/* Reviews */}
        {loading ? (
          <div className="rm-empty">
            <FontAwesomeIcon icon={faRotate} spin />
            <h3>Loading reviews...</h3>
            <p>Please wait while we fetch customer feedback.</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="rm-empty">
            <FontAwesomeIcon icon={faMessage} />
            <h3>No reviews found</h3>
            <p>There are no reviews matching your current selection.</p>
          </div>
        ) : (
          <div className="rm-review-list">
            {filteredReviews.map((review) => (
              <article className="rm-review-card" key={review._id}>
                <div className="rm-review-top">
                  <div className="rm-review-customer">
                    <div className="rm-avatar">
                      {review.name?.charAt(0).toUpperCase() || "C"}
                    </div>

                    <div>
                      <h3>{review.name}</h3>
                      <span>{formatDate(review.createdAt)}</span>
                    </div>
                  </div>

                  <span
                    className={`rm-status rm-status-${review.status?.toLowerCase()}`}
                  >
                    {review.status}
                  </span>
                </div>

                <div className="rm-review-details">
                  {renderStars(Number(review.rating))}
                  <span className="rm-product-name">
                    {review.product}
                  </span>
                </div>

                <p className="rm-review-message">{review.message}</p>

                <div className="rm-review-actions">
                  {review.status !== "Approved" && (
                    <button
                      type="button"
                      className="rm-action-approve"
                      onClick={() =>
                        handleStatusChange(review._id, "Approved")
                      }
                      disabled={
                        updatingId === review._id ||
                        deletingId === review._id
                      }
                    >
                      <FontAwesomeIcon icon={faCheck} />
                      Approve
                    </button>
                  )}

                  {review.status !== "Rejected" && (
                    <button
                      type="button"
                      className="rm-action-reject"
                      onClick={() =>
                        handleStatusChange(review._id, "Rejected")
                      }
                      disabled={
                        updatingId === review._id ||
                        deletingId === review._id
                      }
                    >
                      <FontAwesomeIcon icon={faXmark} />
                      Reject
                    </button>
                  )}

                  <button
                    type="button"
                    className="rm-action-delete"
                    onClick={() => setConfirmDelete(review)}
                    disabled={
                      updatingId === review._id ||
                      deletingId === review._id
                    }
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    Delete
                  </button>

                  {updatingId === review._id && (
                    <span className="rm-action-progress">
                      Updating...
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div
          className="rm-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deletingId) {
              setConfirmDelete(null);
            }
          }}
        >
          <div
            className="rm-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rm-delete-title"
          >
            <div className="rm-modal-icon">
              <FontAwesomeIcon icon={faTrash} />
            </div>

            <h3 id="rm-delete-title">Delete this review?</h3>

            <p>
              Are you sure you want to permanently delete the review submitted
              by <strong>{confirmDelete.name}</strong>?
            </p>

            <div className="rm-modal-actions">
              <button
                type="button"
                className="rm-modal-cancel"
                onClick={() => setConfirmDelete(null)}
                disabled={Boolean(deletingId)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="rm-modal-delete"
                onClick={handleDelete}
                disabled={Boolean(deletingId)}
              >
                <FontAwesomeIcon icon={faTrash} />
                {deletingId ? "Deleting..." : "Delete Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewManagement;
