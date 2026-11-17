import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faBars } from "@fortawesome/free-solid-svg-icons";
import "./AdminTopbar.css";

export default function AdminTopbar({ activeTab, username, setMobileMenuOpen }) {
  const heading = activeTab === "overview" ? "All" : activeTab === "orders" ? "Order management" : "Customer messages";
  return (
    <header className="admin-topbar">
      <button type="button" className="admin-menu-toggle" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation"><FontAwesomeIcon icon={faBars} /></button>
      <div className="admin-topbar-heading"><h1>{heading}</h1></div>
      <div className="admin-profile">
        <div className="admin-profile-avatar"><FontAwesomeIcon icon={faUser} /></div>
        <div><strong>{username || "Administrator"}</strong><span>Store admin</span></div>
      </div>
    </header>
  );
}
