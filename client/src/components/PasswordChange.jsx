import React, { useState } from 'react';
import { userAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';

function PasswordChange() {
  const navigate = useNavigate();
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = e => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }

    // Сбрасываем сообщение об успехе при любом изменении
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Текущий пароль обязателен';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'Новый пароль обязателен';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Пароль должен содержать не менее 8 символов';
    } else {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#^])[A-Za-z\d@$!%*?&_\-#^]{8,}$/;
      if (!passwordRegex.test(passwordData.newPassword)) {
        newErrors.newPassword =
          'Пароль должен содержать заглавные и строчные буквы, цифры и специальные символы (@, $, !, %, *, ?, &, _, -, #, ^)';
      }
    }

    // Проверка на совпадение текущего и нового пароля
    if (passwordData.currentPassword === passwordData.newPassword) {
      newErrors.newPassword = 'Новый пароль должен отличаться от текущего';
    }

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      newErrors.confirmNewPassword = 'Пароли не совпадают';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      await userAPI.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      // Очищаем форму после успешного обновления
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });

      setSuccessMessage('Пароль успешно изменен');

      // Перенаправление на профиль через 2 секунды после успешной смены пароля
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (error) {
      if (error.response) {
        if (
          error.response.status === 403 &&
          error.response.data &&
          error.response.data.message &&
          error.response.data.message.includes('CSRF')
        ) {
          // Обработка ошибок CSRF
          setErrors({
            general:
              'Ошибка безопасности. Пожалуйста, обновите страницу и попробуйте снова.',
          });
        } else if (error.response.data) {
          setErrors({
            general: error.response.data.message || 'Ошибка при изменении пароля',
          });
        }
      } else {
        setErrors({
          general: 'Сервер недоступен. Попробуйте позже.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Изменение пароля
      </h2>

      {errors.general && errors.general.trim() !== '' && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {errors.general}
        </div>
      )}

      {successMessage && successMessage.trim() !== '' && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            placeholder="Текущий пароль *"
            value={passwordData.currentPassword}
            onChange={handleInputChange}
            className={`w-full p-3 border ${
              errors.currentPassword ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition`}
          />
          {errors.currentPassword && (
            <p className="mt-1 text-red-500 text-sm">{errors.currentPassword}</p>
          )}
        </div>

        <div>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            placeholder="Новый пароль *"
            value={passwordData.newPassword}
            onChange={handleInputChange}
            className={`w-full p-3 border ${
              errors.newPassword ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition`}
          />
          <p className="mt-1 text-xs text-gray-500">
            Минимум 8 символов, включая заглавные и строчные буквы, цифры и специальные
            символы (@, $, !, %, *, ?, &, _, -, #, ^)
          </p>
          {errors.newPassword && (
            <p className="mt-1 text-red-500 text-sm">{errors.newPassword}</p>
          )}
        </div>

        <div>
          <input
            type="password"
            id="confirmNewPassword"
            name="confirmNewPassword"
            placeholder="Подтверждение нового пароля *"
            value={passwordData.confirmNewPassword}
            onChange={handleInputChange}
            className={`w-full p-3 border ${
              errors.confirmNewPassword ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition`}
          />
          {errors.confirmNewPassword && (
            <p className="mt-1 text-red-500 text-sm">{errors.confirmNewPassword}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full p-3 rounded-md text-white font-medium ${
            isSubmitting ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
          } transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
        >
          {isSubmitting ? 'Сохранение...' : 'Изменить пароль'}
        </button>
      </form>
    </div>
  );
}

export default PasswordChange;
