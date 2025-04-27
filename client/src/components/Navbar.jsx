import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  const [userName, setUserName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Проверяем авторизацию пользователя при загрузке страницы
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      // Здесь в будущем можно добавить запрос данных пользователя
      // чтобы отобразить его имя после входа
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserName('');
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
