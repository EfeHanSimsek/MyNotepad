import { Plus, X } from "lucide-react";
import type { ComponentType } from "react";
import type { ViewKey } from "../../domain/types";

interface NavItem {
  key: ViewKey;
  label: string;
  icon: ComponentType<{ size?: number }>;
}

interface SidebarProps {
  open: boolean;
  navItems: NavItem[];
  activeView: ViewKey;
  user: { name: string; avatar: string };
  syncStatus: "idle" | "saving" | "saved" | "error";
  onClose: () => void;
  onCreateNote: () => void;
  onSelectView: (view: ViewKey) => void;
}

export function Sidebar({ open, navItems, activeView, user, syncStatus, onClose, onCreateNote, onSelectView }: SidebarProps) {
  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="brand">
        <div className="brand-mark">A</div>
        <div>
          <strong>Atlas Notes</strong>
          <span>Local-first workspace</span>
        </div>
        <button className="icon-button mobile-only" onClick={onClose} aria-label="Menüyü kapat">
          <X size={18} />
        </button>
      </div>

      <button className="primary-action" onClick={onCreateNote}>
        <Plus size={18} /> Yeni not
      </button>

      <nav className="nav-list">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              className={activeView === item.key ? "active" : ""}
              onClick={() => {
                onSelectView(item.key);
                onClose();
              }}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sync-pill">
          <span className={`status-dot ${syncStatus}`} />
          {syncStatus === "saving" ? "Kaydediliyor" : syncStatus === "error" ? "Sync hatası" : "Kaydedildi"}
        </div>
        <div className="profile-chip">
          <div>{user.avatar}</div>
          <span>{user.name}</span>
        </div>
      </div>
    </aside>
  );
}
