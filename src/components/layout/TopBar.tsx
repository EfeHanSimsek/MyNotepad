import { Bell, Menu, Moon, Search, Sparkles, Sun } from "lucide-react";
import type { ReactNode } from "react";

interface TopBarProps {
  query: string;
  theme: "light" | "dark";
  hasUnreadNotifications: boolean;
  onQueryChange: (query: string) => void;
  onOpenSidebar: () => void;
  onOpenCommand: () => void;
  onToggleTheme: () => void;
  onToggleNotifications: () => void;
  children?: ReactNode;
}

export function TopBar({
  query,
  theme,
  hasUnreadNotifications,
  onQueryChange,
  onOpenSidebar,
  onOpenCommand,
  onToggleTheme,
  onToggleNotifications,
  children
}: TopBarProps) {
  return (
    <header className="topbar">
      <button className="icon-button mobile-only" onClick={onOpenSidebar} aria-label="Menüyü aç">
        <Menu size={19} />
      </button>
      <div className="search-box">
        <Search size={18} />
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Ara: tag:ürün has:task is:pinned" />
      </div>
      <button className="ghost-button" onClick={onOpenCommand}>
        <Sparkles size={17} /> Komut
      </button>
      <button className="icon-button" onClick={onToggleTheme} aria-label="Tema değiştir">
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <button className="icon-button" onClick={onToggleNotifications} aria-label="Bildirimler">
        <Bell size={18} />
        {hasUnreadNotifications && <span className="badge-dot" />}
      </button>
      {children}
    </header>
  );
}
