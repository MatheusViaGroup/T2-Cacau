
export const theme = {
  colors: {
    primary: {
      main: '#004a99', // Azul Oficial Via Group
      light: '#0066cc',
      dark: '#003366',
      gradient: 'from-[#004a99] to-[#0066cc]',
    },
    secondary: {
      main: '#00adef', // Ciano Oficial Via Group
      light: '#33bdff',
      dark: '#0086b3',
      gradient: 'from-[#00adef] to-[#33bdff]',
    },
    neutral: {
      dark: '#0f172a',
      light: '#f8fafc',
      glass: 'rgba(255, 255, 255, 0.75)',
    }
  },
  animations: {
    transition: 'transition-all duration-300 ease-in-out',
    hover: 'hover:scale-[1.02] hover:-translate-y-1 active:scale-95',
  },
  shadows: {
    premium: 'shadow-[0_20px_50px_rgba(0,0,0,0.1)]',
    glowBlue: 'shadow-[0_0_20px_rgba(0,74,153,0.3)]',
    glowCyan: 'shadow-[0_0_20px_rgba(0,173,239,0.3)]',
  }
};
