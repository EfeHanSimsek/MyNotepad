import type { AppState } from "../../domain/types";

interface NotificationPanelProps {
  state: AppState;
  markRead: (notificationId: string) => void;
  markAllRead: () => void;
  close: () => void;
  formatDate: (value?: string) => string;
}

export function NotificationPanel({ state, markRead, markAllRead, close, formatDate }: NotificationPanelProps) {
  return (
    <div className="notification-popover">
      <div className="popover-header">
        <strong>Bildirimler</strong>
        <button className="ghost-button" onClick={markAllRead}>Tümünü okundu yap</button>
      </div>
      {state.notifications.length === 0 && <div className="empty-state">Bildirim yok.</div>}
      {state.notifications.map((notification) => (
        <button
          key={notification.id}
          className={`notification-item ${notification.read ? "" : "unread"}`}
          onClick={() => {
            markRead(notification.id);
            close();
          }}
        >
          <span>{notification.title}</span>
          <small>{notification.body}</small>
          <em>{formatDate(notification.createdAt)}</em>
        </button>
      ))}
    </div>
  );
}
