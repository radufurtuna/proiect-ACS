// Culori comune - Paletă modernă și rafinată
export const COLORS = {
  // Backgrounds
  background: '#f8fafc',
  backgroundLight: '#fafbfc',
  white: '#ffffff',
  
  // Text
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#64748b',
  textLight: '#94a3b8',
  
  // Primary Actions
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  primaryLight: '#dbeafe',
  
  // Danger Actions
  danger: '#ef4444',
  dangerHover: '#dc2626',
  dangerLight: '#fee2e2',
  
  // Success Actions
  success: '#10b981',
  successHover: '#059669',
  successLight: '#d1fae5',
  
  // Neutral Actions
  dark: '#1e293b',
  darkHover: '#0f172a',
  
  // Status Messages
  errorBg: '#fef2f2',
  errorText: '#dc2626',
  errorBorder: '#fecaca',
  successBg: '#f0fdf4',
  successText: '#16a34a',
  successBorder: '#bbf7d0',
  infoBg: '#eff6ff',
  infoText: '#2563eb',
  infoBorder: '#bfdbfe',
  
  // Borders & Dividers
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  borderDark: '#cbd5e1',
  
  // Shadows
  shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
} as const;

// Stiluri pentru layout
export const layoutStyles = {
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: COLORS.background,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  
  pageContainerFlex: {
    minHeight: '100vh',
    backgroundColor: COLORS.background,
    display: 'flex',
    flexDirection: 'column' as const,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  
  centeredContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    padding: '1rem',
  },
} as const;

// Stiluri pentru header
export const headerStyles = {
  header: {
    backgroundColor: COLORS.white,
    padding: '1rem 2rem',
    boxShadow: COLORS.shadow,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `1px solid ${COLORS.borderLight}`,
  },
  
  fixedHeader: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: COLORS.white,
    padding: '1rem 2rem',
    boxShadow: COLORS.shadowMd,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `1px solid ${COLORS.borderLight}`,
  },
  
  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    letterSpacing: '-0.025em',
  },
} as const;

// Stiluri pentru card/container
export const cardStyles = {
  card: {
    backgroundColor: COLORS.white,
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: COLORS.shadow,
    border: `1px solid ${COLORS.borderLight}`,
    transition: 'all 0.2s ease-in-out',
  },
  
  cardLarge: {
    backgroundColor: COLORS.white,
    borderRadius: '12px',
    padding: '2rem',
    boxShadow: COLORS.shadow,
    border: `1px solid ${COLORS.borderLight}`,
    transition: 'all 0.2s ease-in-out',
  },
  
  cardElevated: {
    backgroundColor: COLORS.white,
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: COLORS.shadowLg,
    border: `1px solid ${COLORS.borderLight}`,
    transition: 'all 0.2s ease-in-out',
  },
  
  cardHover: {
    boxShadow: COLORS.shadowMd,
    transform: 'translateY(-2px)',
  },
} as const;

// Stiluri pentru main content
export const mainStyles = {
  main: {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  
  mainWithMargin: {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
    marginLeft: '200px',
    overflowY: 'auto' as const,
    height: 'calc(100vh - 73px)',
  },
} as const;

// Stiluri pentru butoane
export const buttonStyles = {
  base: {
    padding: '0.625rem 1.25rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600' as const,
    fontSize: '0.9375rem',
    transition: 'all 0.2s ease-in-out',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    lineHeight: '1.5',
  },
  
  primary: {
    padding: '0.625rem 1.25rem',
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600' as const,
    fontSize: '0.9375rem',
    transition: 'all 0.2s ease-in-out',
    boxShadow: COLORS.shadowSm,
  },
  
  primaryHover: {
    backgroundColor: COLORS.primaryHover,
    boxShadow: COLORS.shadow,
    transform: 'translateY(-1px)',
  },
  
  danger: {
    padding: '0.625rem 1.25rem',
    backgroundColor: COLORS.danger,
    color: COLORS.white,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600' as const,
    fontSize: '0.9375rem',
    transition: 'all 0.2s ease-in-out',
    boxShadow: COLORS.shadowSm,
  },
  
  dangerHover: {
    backgroundColor: COLORS.dangerHover,
    boxShadow: COLORS.shadow,
    transform: 'translateY(-1px)',
  },
  
  success: {
    padding: '0.625rem 1.25rem',
    backgroundColor: COLORS.success,
    color: COLORS.white,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600' as const,
    fontSize: '0.9375rem',
    transition: 'all 0.2s ease-in-out',
    boxShadow: COLORS.shadowSm,
  },
  
  successHover: {
    backgroundColor: COLORS.successHover,
    boxShadow: COLORS.shadow,
    transform: 'translateY(-1px)',
  },
  
  dark: {
    padding: '0.625rem 1.25rem',
    backgroundColor: COLORS.dark,
    color: COLORS.white,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600' as const,
    fontSize: '0.9375rem',
    transition: 'all 0.2s ease-in-out',
    boxShadow: COLORS.shadowSm,
  },
  
  darkHover: {
    backgroundColor: COLORS.darkHover,
    boxShadow: COLORS.shadow,
    transform: 'translateY(-1px)',
  },
  
  secondary: {
    padding: '0.625rem 1.25rem',
    backgroundColor: COLORS.white,
    color: COLORS.textPrimary,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600' as const,
    fontSize: '0.9375rem',
    transition: 'all 0.2s ease-in-out',
  },
  
  secondaryHover: {
    backgroundColor: COLORS.backgroundLight,
    borderColor: COLORS.borderDark,
    boxShadow: COLORS.shadowSm,
  },
  
  small: {
    padding: '0.375rem 0.875rem',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600' as const,
    transition: 'all 0.2s ease-in-out',
  },
  
  disabled: {
    cursor: 'not-allowed',
    opacity: 0.5,
    transform: 'none !important',
    boxShadow: 'none !important',
  },
} as const;

// Stiluri pentru input
export const inputStyles = {
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    fontSize: '0.9375rem',
    boxSizing: 'border-box' as const,
    backgroundColor: COLORS.white,
    color: COLORS.textPrimary,
    transition: 'all 0.2s ease-in-out',
    outline: 'none',
  },
  
  inputFocus: {
    borderColor: COLORS.primary,
    boxShadow: `0 0 0 3px ${COLORS.primaryLight}`,
  },
  
  inputError: {
    borderColor: COLORS.danger,
    boxShadow: `0 0 0 3px ${COLORS.dangerLight}`,
  },
  
  inputDisabled: {
    backgroundColor: COLORS.background,
    color: COLORS.textMuted,
    cursor: 'not-allowed',
  },
  
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '600' as const,
    fontSize: '0.875rem',
    color: COLORS.textPrimary,
    letterSpacing: '0.025em',
  },
  
  labelError: {
    color: COLORS.danger,
  },
} as const;

// Stiluri pentru mesaje
export const messageStyles = {
  error: {
    padding: '1rem 1.25rem',
    backgroundColor: COLORS.errorBg,
    color: COLORS.errorText,
    borderRadius: '8px',
    marginBottom: '1rem',
    border: `1px solid ${COLORS.errorBorder}`,
    fontSize: '0.9375rem',
    lineHeight: '1.5',
  },
  
  errorSmall: {
    padding: '0.75rem 1rem',
    backgroundColor: COLORS.errorBg,
    color: COLORS.errorText,
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.875rem',
    lineHeight: '1.5',
    border: `1px solid ${COLORS.errorBorder}`,
  },
  
  success: {
    padding: '1rem 1.25rem',
    backgroundColor: COLORS.successBg,
    color: COLORS.successText,
    borderRadius: '8px',
    marginBottom: '1rem',
    border: `1px solid ${COLORS.successBorder}`,
    fontSize: '0.9375rem',
    lineHeight: '1.5',
  },
  
  info: {
    padding: '1rem 1.25rem',
    backgroundColor: COLORS.infoBg,
    color: COLORS.infoText,
    borderRadius: '8px',
    marginBottom: '1rem',
    border: `1px solid ${COLORS.infoBorder}`,
    fontSize: '0.9375rem',
    lineHeight: '1.5',
  },
} as const;

// Stiluri pentru tabele
export const tableStyles = {
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    backgroundColor: COLORS.white,
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: COLORS.shadow,
  },
  
  th: {
    padding: '1rem',
    textAlign: 'left' as const,
    fontWeight: '700' as const,
    backgroundColor: COLORS.backgroundLight,
    borderBottom: `2px solid ${COLORS.border}`,
    color: COLORS.textPrimary,
    fontSize: '0.875rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  
  td: {
    padding: '1rem',
    borderBottom: `1px solid ${COLORS.borderLight}`,
    color: COLORS.textPrimary,
    fontSize: '0.9375rem',
  },
  
  trHover: {
    backgroundColor: COLORS.backgroundLight,
  },
} as const;

// Stiluri pentru flexbox
export const flexStyles = {
  row: {
    display: 'flex',
    gap: '0.5rem',
  },
  
  rowCenter: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  
  column: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
} as const;

