import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { ORDER_STATUSES, MESSAGE_STATUSES } from "../utils/adminHelpers";
import "./StatusSelect.css";

export default function StatusSelect({
  type,
  item,
  pendingStatuses,
  updatingItems,
  setPendingStatuses,
  updateStatus,
  onSaved,
}) {
  const statuses = type === "order" ? ORDER_STATUSES : MESSAGE_STATUSES;
  const key = `${type}-${item._id}`;
  const currentStatus = item.status || statuses[0];
  const selectedStatus = pendingStatuses[key] ?? currentStatus;
  const hasPendingChange = selectedStatus !== currentStatus;
  const isUpdating = Boolean(updatingItems[key]);

  const handleCancel = () => {
    setPendingStatuses((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
  };

  const handleSave = async () => {
    if (!hasPendingChange || isUpdating) return;
    const saved = await updateStatus(type, item._id, selectedStatus);
    if (saved) onSaved?.();
  };

  return (
    <div className="admin-status-select-wrap">
      <select
        className="admin-status-select"
        value={selectedStatus}
        disabled={isUpdating}
        onChange={(event) => {
          const newStatus = event.target.value;
          setPendingStatuses((previous) => {
            const next = { ...previous };
            if (newStatus === currentStatus) delete next[key];
            else next[key] = newStatus;
            return next;
          });
        }}
        aria-label={`Select ${type} status`}
      >
        {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
      </select>
      <FontAwesomeIcon className="admin-select-chevron" icon={faChevronDown} />
      {hasPendingChange && (
        <div className="admin-status-actions" data-status-key={key}>
          <button type="button" className="admin-secondary-button" disabled={isUpdating} onClick={handleSave}>
            {isUpdating ? "Saving..." : "Save"}
          </button>
          <button type="button" className="admin-secondary-button" disabled={isUpdating} onClick={handleCancel}>Cancel</button>
        </div>
      )}
    </div>
  );
}
