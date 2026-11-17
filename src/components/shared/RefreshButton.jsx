import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotate } from "@fortawesome/free-solid-svg-icons";
import "./RefreshButton.css";

export default function RefreshButton({ onClick, loading }) {
  return (
    <button type="button" className="admin-refresh-button" onClick={onClick} disabled={loading}>
      <FontAwesomeIcon icon={faRotate} spin={loading} />
      {loading ? "Refreshing..." : "Refresh"}
    </button>
  );
}
