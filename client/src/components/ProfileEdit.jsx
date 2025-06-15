import React, { useState, useEffect } from 'react';
import { userAPI } from '../utils/api';

const ProfileEdit = () => {
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);

        const userFromStorage = localStorage.getItem('userData');
        if (userFromStorage) {
          try {
            const parsedUser = JSON.parse(userFromStorage);
            if (parsedUser) {
              setUserData({
                firstName: parsedUser.firstName || '',
                lastName: parsedUser.lastName || '',
                middleName: parsedUser.middleName || '',
                description: parsedUser.description || '',
                birthDate: parsedUser.birthDate ? parsedUser.birthDate.split('T')[0] : '',
              });
            }
          } catch {
            return;
          }
        }

        const response = await userAPI.getCurrentUser();
        const user = response.data;

        if (user) {
          setUserData({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            middleName: user.middleName || '',
            description: user.description || '',
            birthDate: user.birthDate ? user.birthDate.split('T')[0] : '',
          });
          setErrors({});
        }
      } catch {
        const hasLocalData = localStorage.getItem('userData');
        if (!hasLocalData) {
          setErrors({ general: 'Ошибка при загрузке данных пользователя' });
        }
      } finally {
        setIsLoading(false);
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
    setErrors({});

    try {
      const dataToUpdate = {
        firstName: userData.firstName,
        lastName: userData.lastName || '',
        middleName: userData.middleName || '',
        description: userData.description || '',
        birthDate: userData.birthDate || null,
      };

      const response = await userAPI.updateProfile(dataToUpdate);
      const updatedUser = response.data;

      const userFromStorage = JSON.parse(localStorage.getItem('userData') || '{}');
      const newUserData = {
        ...userFromStorage,
        firstName: updatedUser.firstName || userData.firstName,
        lastName: updatedUser.lastName || userData.lastName,
        middleName: updatedUser.middleName || userData.middleName,
        description: updatedUser.description || userData.description,
        birthDate: updatedUser.birthDate || userData.birthDate,
      };

      localStorage.setItem('userData', JSON.stringify(newUserData));

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

  if (isLoading) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Загрузка данных...
        </h2>
        <div className="flex justify-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Личные данные</h2>

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
          <input
            type="text"
            id="firstName"
            name="firstName"
            placeholder="Имя *"
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
          <input
            type="text"
            id="lastName"
            name="lastName"
            placeholder="Фамилия"
            value={userData.lastName}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </div>

        <div>
          <input
            type="text"
            id="middleName"
            name="middleName"
            placeholder="Отчество"
            value={userData.middleName}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </div>

        <div>
          <input
            type="date"
            id="birthDate"
            name="birthDate"
            placeholder="Дата рождения"
            value={userData.birthDate}
            onChange={handleInputChange}
            max={new Date().toISOString().split('T')[0]}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
          <p className="mt-1 text-xs text-gray-500">Дата рождения</p>
        </div>

        <div>
          <textarea
            id="description"
            name="description"
            placeholder="О себе"
            value={userData.description}
            onChange={handleInputChange}
            rows="3"
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
};

export default ProfileEdit;
