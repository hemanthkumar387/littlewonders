import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./StatusBadge.css";

export default function StatusBadge({ status, icon }) {
  return (
    <span className={`admin-status admin-status-${String(status || "pending").toLowerCase().replace(/\s+/g, "-")}`}>
      {icon ? <FontAwesomeIcon icon={icon} /> : <span className="admin-status-dot" />}
      {status || "Pending"}
    </span>
  );
}
