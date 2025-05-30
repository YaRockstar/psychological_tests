import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { userAPI } from '../utils/api';

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const location = useLocation();

  // Проверяем авторизацию пользователя при загрузке страницы и смене роута
  useEffect(() => {
    // Проверяем наличие токена
    const token = localStorage.getItem('token');

    if (token) {
      setIsLoggedIn(true);

      // Сначала пробуем загрузить данные из localStorage
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          const parsedData = JSON.parse(userData);
          setUserName(parsedData.name);
          setUserRole(parsedData.role);
        } catch (error) {
          console.error(
            'Ошибка при парсинге данных пользователя из localStorage:',
            error
          );
        }
      }

      // Функция для загрузки данных пользователя с сервера
      const loadUserData = async () => {
        try {
          const response = await userAPI.getCurrentUser();
          const user = response.data;

          setUserName(user.firstName || '');
          setUserRole(user.role || '');

          // Сохраняем данные в localStorage для ускорения загрузки в будущем
          localStorage.setItem(
            'userData',
            JSON.stringify({
              name: user.firstName,
              role: user.role,
            })
          );
        } catch (error) {
          console.error('Ошибка при получении данных пользователя:', error);
          if (error.response && error.response.status === 401) {
            // Если токен недействителен, удаляем его
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
            setIsLoggedIn(false);
            setUserName('');
            setUserRole('');
          }
        }
      };

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
        <div className="flex items-center space-x-6">
          <Link to="/home" className="text-2xl font-bold text-indigo-600">
            PsyTests
          </Link>
          {/* Ссылки для авторов */}
          {isLoggedIn && userRole === 'author' && (
            <>
              <Link
                to="/tests/my"
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Мои тесты
              </Link>
              <Link
                to="/groups"
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Мои группы
              </Link>
            </>
          )}
          {/* Ссылка на все тесты доступна только не-авторам */}
          {(!isLoggedIn || userRole !== 'author') && (
            <Link
              to="/tests"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Все тесты
            </Link>
          )}
          {/* История тестов доступна только авторизованным не-авторам */}
          {isLoggedIn && userRole !== 'author' && (
            <Link
              to="/tests/history"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Пройденные тесты
            </Link>
          )}
        </div>
        <div className="flex items-center space-x-6">
          {isLoggedIn ? (
            <>
              {userRole === 'author' ? (
                <>
                  <Link
                    to="/profile"
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Мой профиль
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/my-groups"
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Мои группы
                  </Link>
                  <Link
                    to="/profile"
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Мой профиль
                  </Link>
                </>
              )}
              <span className="text-gray-700">Привет, {userName || 'пользователь'}!</span>
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
