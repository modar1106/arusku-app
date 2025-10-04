import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Cek preferensi yang tersimpan di local storage saat pertama kali memuat
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light'; // Default ke 'light' jika tidak ada
  });

  // src/context/ThemeContext.jsx

  useEffect(() => {
    const root = window.document.documentElement; // elemen <html>
    const body = window.document.body;           // elemen <body>

    // Selalu hapus dulu untuk reset
    root.classList.remove('dark');
    
    if (theme === 'dark') {
      console.log('DIAGNOSTIK: Menerapkan tema DARK.');
      root.classList.add('dark');
      body.style.backgroundColor = '#111827'; // Warna untuk bg-gray-900
    } else {
      console.log('DIAGNOSTIK: Menerapkan tema LIGHT.');
      // Class 'dark' sudah dihapus di atas
      body.style.backgroundColor = '#F9FAFB'; // Warna untuk bg-gray-50
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