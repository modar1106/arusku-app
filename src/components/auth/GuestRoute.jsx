import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function GuestRoute({ children }) {
  const { currentUser } = useAuth();

  if (currentUser) {
    // Jika sudah ada user yang login, alihkan ke halaman utama
    return <Navigate to="/" />;
  }

  // Jika belum login, tampilkan halaman yang diminta (Login/Register)
  return children;
}