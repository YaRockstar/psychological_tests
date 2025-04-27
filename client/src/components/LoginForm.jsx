import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { userAPI } from '../utils/api';

function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [isAuthor, setIsAuthor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Сбрасываем ошибку при изменении полей
    if (error) setError('');
  };

  const handleCheckboxChange = () => {
    setIsAuthor(!isAuthor);
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await userAPI.login({
        email: formData.email,
        password: formData.password,
      });

      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);

        // Сохраняем данные пользователя
        if (response.data.user) {
          localStorage.setItem('userData', JSON.stringify(response.data.user));
        }

        console.log('Авторизация успешна!');

        // Перенаправляем пользователя на главную страницу с перезагрузкой
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Ошибка авторизации:', error);

      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError('Произошла ошибка при входе в систему');
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

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="email"
          name="email"
          placeholder="Введите вашу почту"
          value={formData.email}
          onChange={handleInputChange}
          required
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
        />

        <input
          type="password"
          name="password"
          placeholder="Введите ваш пароль"
          value={formData.password}
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
