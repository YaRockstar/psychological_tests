import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../utils/api';

function LoginForm() {
  const navigate = useNavigate();
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
        console.log('Авторизация успешна!');

        // Перенаправляем пользователя на главную страницу
        navigate('/');
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
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg shadow-md w-full max-w-md"
    >
      <h2 className="text-2xl font-bold mb-4 text-center">Авторизация</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <input
        type="email"
        name="email"
        placeholder="Почта"
        value={formData.email}
        onChange={handleInputChange}
        required
        className="w-full p-2 mb-4 border border-gray-300 rounded"
      />
      <input
        type="password"
        name="password"
        placeholder="Пароль"
        value={formData.password}
        onChange={handleInputChange}
        required
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
        {isSubmitting ? 'Вход...' : 'Войти'}
      </button>
    </form>
  );
}

export default LoginForm;
