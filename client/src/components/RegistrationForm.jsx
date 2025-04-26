import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../utils/api';

function RegistrationForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    middleName: '',
    description: '',
    birthDate: '',
  });

  const [isAuthor, setIsAuthor] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Сбрасываем ошибку при изменении поля
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleCheckboxChange = () => {
    setIsAuthor(!isAuthor);
  };

  const validateForm = () => {
    const newErrors = {};

    // Валидация почты
    if (!formData.email) {
      newErrors.email = 'Почта обязательна';
    } else {
      const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Некорректный адрес электронной почты';
      }
    }

    // Валидация имени
    if (!formData.firstName) {
      newErrors.firstName = 'Имя обязательно';
    }

    // Валидация паролей
    if (!formData.password) {
      newErrors.password = 'Пароль обязателен';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Пароль должен содержать не менее 8 символов';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
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

    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName || '',
        middleName: formData.middleName || '',
        description: formData.description || '',
        birthDate: formData.birthDate || null,
        role: isAuthor ? 'author' : 'user',
      };

      const response = await userAPI.register(userData);

      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        console.log('Регистрация успешна!');

        // Перенаправляем пользователя на главную страницу
        navigate('/');
      }
    } catch (error) {
      console.error('Ошибка регистрации:', error);

      if (error.response && error.response.data) {
        // Обрабатываем ошибки с сервера
        if (error.response.data.field) {
          setErrors({
            ...errors,
            [error.response.data.field]: error.response.data.message,
          });
        } else {
          setErrors({
            ...errors,
            general: error.response.data.message || 'Произошла ошибка при регистрации',
          });
        }
      } else {
        setErrors({
          ...errors,
          general: 'Сервер недоступен. Попробуйте позже.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg shadow-md w-full max-w-md"
    >
      <h2 className="text-2xl font-bold mb-4 text-center">Регистрация</h2>

      {errors.general && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errors.general}
        </div>
      )}

      <input
        type="email"
        name="email"
        placeholder="Почта *"
        value={formData.email}
        onChange={handleInputChange}
        className={`w-full p-2 mb-4 border ${
          errors.email ? 'border-red-500' : 'border-gray-300'
        } rounded`}
      />
      {errors.email && <p className="text-red-500 text-sm -mt-3 mb-4">{errors.email}</p>}

      <input
        type="password"
        name="password"
        placeholder="Пароль *"
        value={formData.password}
        onChange={handleInputChange}
        className={`w-full p-2 mb-4 border ${
          errors.password ? 'border-red-500' : 'border-gray-300'
        } rounded`}
      />
      {errors.password && (
        <p className="text-red-500 text-sm -mt-3 mb-4">{errors.password}</p>
      )}

      <input
        type="password"
        name="confirmPassword"
        placeholder="Подтверждение пароля *"
        value={formData.confirmPassword}
        onChange={handleInputChange}
        className={`w-full p-2 mb-4 border ${
          errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
        } rounded`}
      />
      {errors.confirmPassword && (
        <p className="text-red-500 text-sm -mt-3 mb-4">{errors.confirmPassword}</p>
      )}

      <input
        type="text"
        name="firstName"
        placeholder="Имя *"
        value={formData.firstName}
        onChange={handleInputChange}
        className={`w-full p-2 mb-4 border ${
          errors.firstName ? 'border-red-500' : 'border-gray-300'
        } rounded`}
      />
      {errors.firstName && (
        <p className="text-red-500 text-sm -mt-3 mb-4">{errors.firstName}</p>
      )}

      <input
        type="text"
        name="lastName"
        placeholder="Фамилия"
        value={formData.lastName}
        onChange={handleInputChange}
        className="w-full p-2 mb-4 border border-gray-300 rounded"
      />

      <input
        type="text"
        name="middleName"
        placeholder="Отчество"
        value={formData.middleName}
        onChange={handleInputChange}
        className="w-full p-2 mb-4 border border-gray-300 rounded"
      />

      <textarea
        name="description"
        placeholder="Описание пользователя"
        value={formData.description}
        onChange={handleInputChange}
        className="w-full p-2 mb-4 border border-gray-300 rounded"
      />

      <input
        type="date"
        name="birthDate"
        value={formData.birthDate}
        onChange={handleInputChange}
        className="w-full p-2 mb-4 border border-gray-300 rounded"
      />

      <div className="checkbox mb-4">
        <label className="text-lg">
          <input
            type="checkbox"
            checked={isAuthor}
            onChange={handleCheckboxChange}
            className="mr-2"
          />
          Я автор
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full ${
          isSubmitting ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'
        } text-white p-2 rounded transition-colors`}
      >
        {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
      </button>
    </form>
  );
}

export default RegistrationForm;
