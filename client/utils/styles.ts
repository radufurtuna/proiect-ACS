// Culori comune
export const COLORS = {
  // Backgrounds
  background: '#f5f5f5',
  white: 'white',
  
  // Text
  textPrimary: 'black',
  textSecondary: '#475569',
  textMuted: '#666',
  
  // Buttons
  primary: '#007bff',
  danger: '#dc3545',
  success: 'green',
  dark: '#343a40',
  
  // Status
  errorBg: '#fee',
  errorText: '#c33',
  errorBorder: '#fcc',
  successBg: '#efe',
  successText: '#3c3',
  successBorder: '#cfc',
  
  // Borders
  border: '#ddd',
  borderLight: '#e2e8f0',
} as const;

// Stiluri pentru layout
export const layoutStyles = {
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: COLORS.background,
  },
  
  pageContainerFlex: {
    minHeight: '100vh',
    backgroundColor: COLORS.background,
    display: 'flex',
    flexDirection: 'column' as const,
  },
  
  centeredContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
} as const;

// Stiluri pentru header
export const headerStyles = {
  header: {
    backgroundColor: COLORS.white,
    padding: '1rem 2rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  fixedHeader: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: COLORS.white,
    padding: '1rem 2rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 'bold' as const,
    color: COLORS.textPrimary,
  },
} as const;

// Stiluri pentru card/container
export const cardStyles = {
  card: {
    backgroundColor: COLORS.white,
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  
  cardLarge: {
    backgroundColor: COLORS.white,
    borderRadius: '8px',
    padding: '2rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  
  cardElevated: {
    backgroundColor: COLORS.white,
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
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
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500' as const,
    fontSize: '1rem',
  },
  
  primary: {
    padding: '0.5rem 1rem',
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500' as const,
  },
  
  danger: {
    padding: '0.5rem 1rem',
    backgroundColor: COLORS.danger,
    color: COLORS.white,
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500' as const,
  },
  
  success: {
    padding: '0.5rem 1rem',
    backgroundColor: COLORS.success,
    color: COLORS.white,
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500' as const,
  },
  
  dark: {
    padding: '0.5rem 1rem',
    backgroundColor: COLORS.dark,
    color: COLORS.white,
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500' as const,
  },
  
  secondary: {
    padding: '0.5rem 1rem',
    backgroundColor: COLORS.white,
    color: COLORS.textPrimary,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500' as const,
  },
  
  small: {
    padding: '0.35rem 0.75rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  
  disabled: {
    cursor: 'not-allowed',
    opacity: 0.6,
  },
} as const;

// Stiluri pentru input
export const inputStyles = {
  input: {
    width: '100%',
    padding: '0.75rem',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '4px',
    fontSize: '1rem',
    boxSizing: 'border-box' as const,
    backgroundColor: COLORS.white,
    color: COLORS.textPrimary,
  },
  
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500' as const,
    fontSize: '0.875rem',
    color: COLORS.textPrimary,
  },
} as const;

// Stiluri pentru mesaje
export const messageStyles = {
  error: {
    padding: '1rem',
    backgroundColor: COLORS.errorBg,
    color: COLORS.errorText,
    borderRadius: '4px',
    marginBottom: '1rem',
    border: `1px solid ${COLORS.errorBorder}`,
  },
  
  errorSmall: {
    padding: '0.75rem',
    backgroundColor: COLORS.errorBg,
    color: COLORS.errorText,
    borderRadius: '4px',
    marginBottom: '1rem',
    fontSize: '0.875rem',
  },
  
  success: {
    padding: '1rem',
    backgroundColor: COLORS.successBg,
    color: COLORS.successText,
    borderRadius: '4px',
    marginBottom: '1rem',
    border: `1px solid ${COLORS.successBorder}`,
  },
} as const;

// Stiluri pentru tabele
export const tableStyles = {
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  
  th: {
    padding: '0.75rem',
    textAlign: 'left' as const,
    fontWeight: 'bold' as const,
    backgroundColor: '#f8fafc',
    borderBottom: `1px solid ${COLORS.borderLight}`,
  },
  
  td: {
    padding: '0.75rem',
    borderBottom: `1px solid ${COLORS.borderLight}`,
    color: COLORS.textPrimary,
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

