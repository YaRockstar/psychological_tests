import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../utils/api';

function LoginForm() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [isAuthor, setIsAuthor] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleCheckboxChange = () => {
    setIsAuthor(!isAuthor);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!credentials.email) {
      newErrors.email = 'Почта обязательна';
    }

    if (!credentials.password) {
      newErrors.password = 'Пароль обязателен';
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
      const response = await authAPI.login({
        ...credentials,
        role: isAuthor ? 'author' : 'user',
      });

      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);

        if (response.data.user) {
          localStorage.setItem('userData', JSON.stringify(response.data.user));
        }

        window.location.href = '/';
      }
    } catch (error) {
      if (error.response && error.response.data) {
        setErrors({
          general: error.response.data.message || 'Ошибка при входе в систему',
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
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Вход в систему
      </h2>

      {errors.general && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="email"
          name="email"
          placeholder="Введите вашу почту"
          value={credentials.email}
          onChange={handleInputChange}
          required
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
        />

        <input
          type="password"
          name="password"
          placeholder="Введите ваш пароль"
          value={credentials.password}
          onChange={handleInputChange}
          required
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
        />

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
          {isSubmitting ? 'Вход...' : 'Войти'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Еще нет аккаунта?{' '}
          <Link
            to="/register"
            className="font-medium text-indigo-600 hover:text-indigo-800"
          >
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginForm;
