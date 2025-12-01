'use client';

type NavItem = {
  key: 'schedule' | 'resources' | 'settings';
  label: string;
  badge?: string;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'schedule', label: 'Orar'},
  { key: 'resources', label: 'Utilizatori' },
  { key: 'settings', label: 'Setări' },
];

export type AdminSidebarProps = {
  activeItem?: NavItem['key'];
  onSelect?: (nav: NavItem['key']) => void;
};

export default function AdminSidebar({ activeItem, onSelect }: AdminSidebarProps) {
  return (
    <aside
      style={{
        position: 'fixed',
        left: 0,
        top: '73px',
        width: '200px',
        height: 'calc(100vh - 73px)',
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(15, 23, 42, 0.2)',
        padding: '1.5rem 1.25rem',
        boxSizing: 'border-box',
        overflowY: 'auto',
        zIndex: 999,
      }}
    >


      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === activeItem;
          return (
            <button
              key={item.key}
              onClick={() => onSelect?.(item.key)}
              style={{
                border: 'none',
                borderRadius: '0.75rem',
                backgroundColor: isActive ? 'rgba(248, 250, 252, 0.12)' : 'transparent',
                color: 'inherit',
                padding: '0.85rem 1rem',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.95rem',
                transition: 'background-color 0.2s ease',
              }}
            >
              <span>{item.label}</span>
              {item.badge && (
                <span
                  style={{
                    padding: '0.1rem 0.4rem',
                    borderRadius: '999px',
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: 'rgba(248, 250, 252, 0.2)',
                    color: '#f8fafc',
                    fontWeight: 600,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

