
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGaugeHigh,
  faCartPlus,
  faPhone,
  faHeart,
  faArrowRightFromBracket,
  faXmark,
  faWallet,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import "./AdminSidebar.css";

export default function AdminSidebar({
  activeTab,
  navigateTo,
  mobileMenuOpen,
  setMobileMenuOpen,
  stats,
  logout,
}) {
  const navItems = [
    { id: "overview", label: "Overview", icon: faGaugeHigh },
    { id: "orders", label: "Orders", icon: faCartPlus, count: stats.pendingOrders },
    { id: "messages", label: "Contact messages", icon: faPhone, count: stats.unreadMessages },
    { id: "expenses", label: "Expenses", icon: faWallet },
    { id: "reviews", label: "Customer Reviews", icon: faStar },
  ];

  return (
    <>
      {mobileMenuOpen && (
        <button
          type="button"
          className="admin-mobile-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`admin-sidebar ${
          mobileMenuOpen ? "admin-sidebar-open" : ""
        }`}
      >
        <div className="admin-brand">
          <div className="admin-brand-icon">
            <img src="/images/logo.png" alt="LittleWonders Logo" />
          </div>

          <div>
            <h2>LittleWonders</h2>
          </div>

          <button
            type="button"
            className="admin-mobile-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <span className="admin-nav-label">WORKSPACE</span>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`admin-nav-item ${
                activeTab === item.id ? "active" : ""
              }`}
              onClick={() => navigateTo(item.id)}
            >
              <FontAwesomeIcon icon={item.icon} />
              <span>{item.label}</span>

              {item.count > 0 && (
                <span className="admin-nav-count">{item.count}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-sidebar-note">
            <FontAwesomeIcon icon={faHeart} />
            <p>Little things, lovingly managed.</p>
          </div>

          <button
            type="button"
            className="admin-logout-button"
            onClick={logout}
          >
            <FontAwesomeIcon icon={faArrowRightFromBracket} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
