import React, { useState, useEffect } from 'react';
import { userAPI } from '../utils/api';

function ProfileEdit() {
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    description: '',
    birthDate: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Загрузка данных пользователя при монтировании компонента
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await userAPI.getCurrentUser();
        const user = response.data;

        setUserData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          middleName: user.middleName || '',
          description: user.description || '',
          birthDate: user.birthDate ? user.birthDate.split('T')[0] : '',
        });
        // eslint-disable-next-line no-unused-vars
      } catch (error) {
        setErrors({ general: 'Ошибка при загрузке данных пользователя' });
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
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

    if (!userData.firstName) {
      newErrors.firstName = 'Имя обязательно';
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
      const dataToUpdate = {
        firstName: userData.firstName,
        lastName: userData.lastName || '',
        middleName: userData.middleName || '',
        description: userData.description || '',
        birthDate: userData.birthDate || null,
      };

      await userAPI.updateProfile(dataToUpdate);

      // Обновляем данные пользователя в localStorage
      const userFromStorage = JSON.parse(localStorage.getItem('userData') || '{}');
      const updatedUserData = { ...userFromStorage, ...dataToUpdate };
      localStorage.setItem('userData', JSON.stringify(updatedUserData));

      setSuccessMessage('Данные успешно обновлены');
    } catch (error) {
      if (error.response && error.response.data) {
        setErrors({
          general: error.response.data.message || 'Ошибка при обновлении профиля',
        });
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
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md mx-auto mb-8">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Редактирование профиля
      </h2>

      {errors.general && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {errors.general}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Имя *
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={userData.firstName}
            onChange={handleInputChange}
            className={`w-full p-3 border ${
              errors.firstName ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition`}
          />
          {errors.firstName && (
            <p className="mt-1 text-red-500 text-sm">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Фамилия
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={userData.lastName}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </div>

        <div>
          <label
            htmlFor="middleName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Отчество
          </label>
          <input
            type="text"
            id="middleName"
            name="middleName"
            value={userData.middleName}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </div>

        <div>
          <label
            htmlFor="birthDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Дата рождения
          </label>
          <input
            type="date"
            id="birthDate"
            name="birthDate"
            value={userData.birthDate}
            onChange={handleInputChange}
            max={new Date().toISOString().split('T')[0]}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            О себе
          </label>
          <textarea
            id="description"
            name="description"
            value={userData.description}
            onChange={handleInputChange}
            rows="4"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full p-3 rounded-md text-white font-medium ${
            isSubmitting ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
          } transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
        >
          {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </form>
    </div>
  );
}

export default ProfileEdit;
