import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [forceShow, setForceShow] = useState(false);

  // Fallback: después de 3 segundos, forzar la visualización si hay sesión en localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      const hasSession = localStorage.getItem('supabase.auth.token') || 
                        sessionStorage.getItem('supabase.auth.token');
      if (hasSession) {
        setForceShow(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Si está cargando y no hemos forzado la visualización, mostrar loading brevemente
  if (loading && !forceShow) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario y no hemos forzado la visualización, redirigir al login
  if (!user && !forceShow) {
    return <Navigate to="/login" replace />;
  }

  // Usuario autenticado, mostrar contenido
  return children;
};

export default ProtectedRoute;