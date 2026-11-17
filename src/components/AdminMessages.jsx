import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faMagnifyingGlass,
  faPhone,
  faRotate,
} from "@fortawesome/free-solid-svg-icons";
import RefreshButton from "./shared/RefreshButton";
import EmptyState from "./shared/EmptyState";
import StatusBadge from "./shared/StatusBadge";
import StatusSelect from "./StatusSelect";
import { MESSAGE_STATUSES, formatDate } from "../utils/adminHelpers";
import "./AdminMessages.css";

export default function AdminMessages({
  messages,
  filteredMessages,
  loading,
  loadDashboard,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  pendingStatuses,
  updatingItems,
  setPendingStatuses,
  updateStatus,
  setSelectedMessage,
}) {
  const formatSubject = (subject) => {
    if (!subject) return "—";

    return subject.replace(/^\[other\]\s*/i, "").trim();
  };

  return (
    <>
      <div className="admin-page-intro">
        <div>
          <span className="admin-eyebrow">A NOTE FROM SOMEONE</span>
          <h2>Contact messages</h2>
          <p>Read enquiries and follow up with your customers.</p>
        </div>
        <RefreshButton onClick={loadDashboard} loading={loading} />
      </div>
      <div className="admin-toolbar">
        <div className="admin-search">
          <FontAwesomeIcon icon={faMagnifyingGlass} />
          <input
            type="search"
            placeholder="Search name, phone, email or message..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select
          className="admin-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter messages by status"
        >
          <option value="All">All statuses</option>
          {MESSAGE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>
      <div className="admin-results-count">
        Showing {filteredMessages.length} of {messages.length} messages
      </div>
      {loading ? (
        <EmptyState
          icon={faRotate}
          loading
          message="Loading messages..."
          card
        />
      ) : filteredMessages.length === 0 ? (
        <EmptyState
          icon={faEnvelope}
          title="No matching messages"
          message="Try a different search or status filter."
          card
        />
      ) : (
        <div className="admin-messages-list">
          {filteredMessages.map((message) => (
            <article className="admin-inbox-card" key={message._id}>
              <div className="admin-inbox-avatar">
                {(message.name || "C").charAt(0).toUpperCase()}
              </div>
              <div className="admin-inbox-content">
                <div className="admin-inbox-top">
                  <div>
                    <h3>{message.name}</h3>
                    <span>{formatSubject(message.subject)}</span>
                  </div>
                  <StatusBadge status={message.status} />
                </div>
                <p className="admin-inbox-message">{message.message}</p>
                <div className="admin-inbox-meta">
                  <span>
                    <FontAwesomeIcon icon={faPhone} />
                    {message.phone || "No phone recorded"}
                  </span>
                  <span>
                    <FontAwesomeIcon icon={faEnvelope} />
                    {message.email || "No email provided"}
                  </span>
                  <span>{formatDate(message.createdAt)}</span>
                </div>
              </div>
              <div className="admin-inbox-actions">
                <StatusSelect
                  type="message"
                  item={message}
                  pendingStatuses={pendingStatuses}
                  updatingItems={updatingItems}
                  setPendingStatuses={setPendingStatuses}
                  updateStatus={updateStatus}
                />
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => setSelectedMessage(message)}
                >
                  View message
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
