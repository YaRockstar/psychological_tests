import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { userAPI } from '../utils/api';

function Navbar() {
  const [userName, setUserName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const location = useLocation();

  // Функция для загрузки актуальных данных пользователя с сервера
  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await userAPI.getCurrentUser();
        if (response.data) {
          const userData = response.data;
          setUserName(userData.firstName || '');
          setUserRole(userData.role || '');

          // Обновляем данные в localStorage
          localStorage.setItem('userData', JSON.stringify(userData));

          setIsLoggedIn(true);
        }
      }
    } catch (error) {
      console.error('Ошибка при получении данных пользователя:', error);
      // Если токен недействительный или сессия истекла - выходим
      if (error.response && error.response.status === 401) {
        handleLogout();
      }
    }
  };

  // Проверяем авторизацию пользователя при загрузке страницы и смене роута
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      // Сначала устанавливаем данные из localStorage для быстрого отображения
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setUserName(user.firstName || '');
          setUserRole(user.role || '');
          setIsLoggedIn(true);
        } catch (error) {
          console.error(
            'Ошибка при парсинге данных пользователя из localStorage:',
            error
          );
        }
      }

      // Затем загружаем актуальные данные с сервера
      loadUserData();
    } else {
      setIsLoggedIn(false);
      setUserName('');
      setUserRole('');
    }
  }, [location.pathname]); // Обновляем при изменении пути

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    setIsLoggedIn(false);
    setUserName('');
    setUserRole('');
    window.location.href = '/login';
  };

  return (
    <nav className="bg-white shadow-md py-4">
      <div className="w-full px-4 sm:px-6 lg:px-8 mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-indigo-600">
          PsyTests
        </Link>
        <div className="flex items-center space-x-6">
          {isLoggedIn ? (
            <>
              <span className="text-gray-700">Привет, {userName || 'пользователь'}!</span>
              <Link
                to="/profile"
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Мой профиль
              </Link>
              {userRole === 'author' && (
                <>
                  <Link
                    to="/tests/my"
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Мои тесты
                  </Link>
                </>
              )}
              <button
                onClick={handleLogout}
                className="text-sm px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition"
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Войти
              </Link>
              <Link
                to="/register"
                className="text-sm px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition"
              >
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
