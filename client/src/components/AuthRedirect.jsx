import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { userAPI } from '../utils/api';

function AuthRedirect() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Проверяем наличие токена
      const token = localStorage.getItem('token');

      if (!token) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      try {
        // Проверяем валидность токена запросом к API
        await userAPI.getCurrentUser();
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Ошибка при проверке авторизации:', error);
        // Если токен недействителен, удаляем его
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Пока проверяем авторизацию, показываем загрузку
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Перенаправляем в зависимости от статуса авторизации
  return isLoggedIn ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />;
}

export default AuthRedirect;
