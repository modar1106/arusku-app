import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });


  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;

    root.classList.remove('dark');
    
    if (theme === 'dark') {
      console.log('DIAGNOSTIK: Menerapkan tema DARK.');
      root.classList.add('dark');
      body.style.backgroundColor = '#111827';
    } else {
      console.log('DIAGNOSTIK: Menerapkan tema LIGHT.');
      body.style.backgroundColor = '#F9FAFB';
    }
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const value = {
    theme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}