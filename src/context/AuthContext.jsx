import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';

// Membuat context
const AuthContext = createContext();

// Membuat custom hook untuk mempermudah penggunaan context
export function useAuth() {
  return useContext(AuthContext);
}

// Membuat komponen Provider
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listener ini akan berjalan setiap kali status otentikasi berubah (login/logout)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Membersihkan listener saat komponen tidak lagi digunakan
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
  };

  // Kirimkan value ke semua komponen di dalamnya
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}