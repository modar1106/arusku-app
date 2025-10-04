import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    // Jika tidak ada user yang login, alihkan ke halaman /login
    return <Navigate to="/login" />;
  }

  // Jika ada user yang login, tampilkan halaman yang diminta
  return children;
}