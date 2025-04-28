import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import ProfileEdit from './ProfileEdit';
import PasswordChange from './PasswordChange';
import DeleteAccount from './DeleteAccount';

function ProfilePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
    }
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-center mb-8">
        <div className="flex space-x-2" role="group">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-2 text-sm font-medium rounded-lg ${
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
            className={`px-6 py-2 text-sm font-medium rounded-lg ${
              activeTab === 'password'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            } border border-gray-200 transition-colors`}
          >
            Изменить пароль
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('delete')}
            className={`px-6 py-2 text-sm font-medium rounded-lg ${
              activeTab === 'delete'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            } border border-gray-200 transition-colors`}
          >
            Удалить аккаунт
          </button>
        </div>
      </div>

      <div
        className="flex justify-center items-center"
        style={{ minHeight: 'calc(100vh - 350px)' }}
      >
        {activeTab === 'profile' ? (
          <ProfileEdit />
        ) : activeTab === 'password' ? (
          <PasswordChange />
        ) : (
          <DeleteAccount />
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
