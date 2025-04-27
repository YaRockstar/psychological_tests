import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../utils/api';

function RegistrationForm() {
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
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleCheckboxChange = () => {
    setIsAuthor(!isAuthor);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Почта обязательна';
    } else {
      const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Некорректный адрес электронной почты';
      }
    }

    if (!formData.firstName) {
      newErrors.firstName = 'Имя обязательно';
    }

    if (!formData.password) {
      newErrors.password = 'Пароль обязателен';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Пароль должен содержать не менее 8 символов';
    } else {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#^])[A-Za-z\d@$!%*?&_\-#^]{8,}$/;
      if (!passwordRegex.test(formData.password)) {
        newErrors.password =
          'Пароль должен содержать заглавные и строчные буквы, цифры и специальные символы (@, $, !, %, *, ?, &, _, -, #, ^)';
      }
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

      const response = await authAPI.register(userData);

      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);

        if (response.data.user) {
          localStorage.setItem('userData', JSON.stringify(response.data.user));
        }

        window.location.href = '/';
      }
    } catch (error) {
      if (error.response && error.response.data) {
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
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Регистрация</h2>

      {errors.general && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <input
            type="email"
            name="email"
            placeholder="Почта *"
            value={formData.email}
            onChange={handleInputChange}
            className={`w-full p-3 border ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition`}
          />
          {errors.email && <p className="mt-1 text-red-500 text-sm">{errors.email}</p>}
        </div>

        <div>
          <input
            type="password"
            name="password"
            placeholder="Пароль *"
            value={formData.password}
            onChange={handleInputChange}
            className={`w-full p-3 border ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition`}
          />
          <p className="mt-1 text-xs text-gray-500">
            Минимум 8 символов, включая заглавные и строчные буквы, цифры и специальные
            символы (@, $, !, %, *, ?, &, _, -, #, ^)
          </p>
          {errors.password && (
            <p className="mt-1 text-red-500 text-sm">{errors.password}</p>
          )}
        </div>

        <div>
          <input
            type="password"
            name="confirmPassword"
            placeholder="Подтверждение пароля *"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className={`w-full p-3 border ${
              errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition`}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-red-500 text-sm">{errors.confirmPassword}</p>
          )}
        </div>

        <div>
          <input
            type="text"
            name="firstName"
            placeholder="Имя *"
            value={formData.firstName}
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
            name="lastName"
            placeholder="Фамилия"
            value={formData.lastName}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </div>

        <div>
          <input
            type="text"
            name="middleName"
            placeholder="Отчество"
            value={formData.middleName}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </div>

        <div>
          <textarea
            name="description"
            placeholder="О себе"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </div>

        <div>
          <input
            type="date"
            name="birthDate"
            placeholder="Дата рождения"
            value={formData.birthDate}
            onChange={handleInputChange}
            max={new Date().toISOString().split('T')[0]}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center justify-center my-4">
          <input
            id="isAuthor"
            type="checkbox"
            checked={isAuthor}
            onChange={handleCheckboxChange}
            className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label
            htmlFor="isAuthor"
            className="ml-2 block text-base font-medium text-gray-700"
          >
            Я автор
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full p-3 rounded-md text-white font-medium ${
            isSubmitting ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
          } transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
        >
          {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-800">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegistrationForm;
