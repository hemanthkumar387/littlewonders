import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./EmptyState.css";

export default function EmptyState({ icon, title, message, loading = false, card = false }) {
  return (
    <div className={`admin-empty-state${card ? " admin-table-card" : ""}`}>
      <FontAwesomeIcon icon={icon} spin={loading} />
      {title && <h3>{title}</h3>}
      {message && <p>{message}</p>}
    </div>
  );
}
