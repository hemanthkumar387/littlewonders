import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import StatusSelect from "./StatusSelect";
import { formatDate } from "../utils/adminHelpers";
import "./MessageDetailsModal.css";

export default function MessageDetailsModal({ message, onClose, pendingStatuses, updatingItems, setPendingStatuses, updateStatus }) {
  if (!message) return null;
  return (
    <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="admin-detail-modal" role="dialog" aria-modal="true" aria-labelledby="admin-message-modal-title">
        <div className="admin-modal-header">
          <div><span className="admin-eyebrow">CUSTOMER ENQUIRY</span><h2 id="admin-message-modal-title">A little note</h2></div>
          <button type="button" className="admin-icon-button" onClick={onClose} aria-label="Close message details"><FontAwesomeIcon icon={faXmark} /></button>
        </div>
        <div className="admin-modal-body">
          <div className="admin-detail-section">
            <h3>{message.name}</h3>
            <p><strong>Phone:</strong> {message.phone || "No phone recorded"}</p>
            <p><strong>Email:</strong> {message.email || "Not provided"}</p>
            <p><strong>Subject:</strong> {message.subject || "—"}</p>
            <p><strong>Received:</strong> {formatDate(message.createdAt)}</p>
          </div>
          <div className="admin-message-full"><span>MESSAGE</span><p>{message.message}</p></div>
          <div className="admin-detail-section">
            <h3>Message status</h3>
            <StatusSelect type="message" item={message} pendingStatuses={pendingStatuses} updatingItems={updatingItems} setPendingStatuses={setPendingStatuses} updateStatus={updateStatus} onSaved={onClose} />
          </div>
        </div>
      </section>
    </div>
  );
}
