import React, { useState } from 'react';
import { userAPI } from '../utils/api';

function DeleteAccount() {
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteRequest = () => {
    setIsConfirming(true);
    setError('');
  };

  const handleCancelDelete = () => {
    setIsConfirming(false);
    setError('');
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      setError('');

      await userAPI.deleteAccount();

      // После успешного удаления - выход
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      window.location.href = '/';
    } catch (error) {
      console.error('Ошибка при удалении аккаунта:', error);
      setError(error.response?.data?.message || 'Произошла ошибка при удалении аккаунта');
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Удаление аккаунта
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {!isConfirming ? (
        <div className="space-y-6">
          <div className="text-center">
            <div className="mb-6">
              <div className="text-red-600 text-lg font-medium mb-2">Внимание!</div>
              <p className="text-gray-700 mb-4">
                Удаление аккаунта приведет к полной и безвозвратной потере всех ваших
                данных и настроек. Это действие нельзя отменить.
              </p>
            </div>

            <button
              onClick={handleDeleteRequest}
              className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Удалить аккаунт
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="text-red-600 text-lg font-medium mb-2">
              Подтвердите удаление
            </div>
            <p className="text-gray-700 mb-4">
              Вы уверены, что хотите удалить свой аккаунт? Это действие необратимо.
            </p>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={handleCancelDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Отмена
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className={`px-4 py-2 ${
                isDeleting ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'
              } text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2`}
            >
              {isDeleting ? 'Удаление...' : 'Да, удалить'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeleteAccount;
