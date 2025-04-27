import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import ProfileEdit from './ProfileEdit';
import PasswordChange from './PasswordChange';

function ProfilePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  // Проверка аутентификации при монтировании компонента
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
    }
  }, []);

  // Если пользователь не аутентифицирован, перенаправляем на страницу входа
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Мой профиль</h1>

      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-2 text-sm font-medium rounded-l-lg ${
              activeTab === 'profile'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            } border border-gray-200 transition-colors`}
          >
            Личные данные
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`px-6 py-2 text-sm font-medium rounded-r-lg ${
              activeTab === 'password'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            } border border-gray-200 transition-colors`}
          >
            Изменить пароль
          </button>
        </div>
      </div>

      <div
        className="flex justify-center items-center"
        style={{ minHeight: 'calc(100vh - 350px)' }}
      >
        {activeTab === 'profile' ? <ProfileEdit /> : <PasswordChange />}
      </div>
    </div>
  );
}

export default ProfilePage;
