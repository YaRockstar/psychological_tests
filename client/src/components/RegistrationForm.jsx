import React, { useState } from 'react';
import axios from 'axios';

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
  const [passwordError, setPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = () => {
    setIsAuthor(!isAuthor);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    // Валидация почты
    if (!formData.email) {
      setEmailError('Почта не введена');
      return;
    }
    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(formData.email)) {
      setEmailError('Некорректный адрес электронной почты');
      return;
    }
    setEmailError('');

    // Валидация паролей
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Пароли не совпадают');
      return;
    }
    setPasswordError('');

    try {
      const response = await axios.post('https://your-backend-api.com/register', {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName,
        description: formData.description,
        birthDate: formData.birthDate,
        isAuthor,
      });

      localStorage.setItem('token', response.data.token);
      console.log('Регистрация успешна!');
    } catch (error) {
      console.error('Ошибка регистрации:', error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg shadow-md w-full max-w-md"
    >
      <h2 className="text-2xl font-bold mb-4 text-center">Регистрация</h2>
      <input
        type="email"
        name="email"
        placeholder="Почта *"
        value={formData.email}
        onChange={handleInputChange}
        className="w-full p-2 mb-1 border border-gray-300 rounded"
      />
      {emailError && <p className="text-red-500 text-sm mb-4">{emailError}</p>}
      <input
        type="password"
        name="password"
        placeholder="Пароль *"
        value={formData.password}
        onChange={handleInputChange}
        className="w-full p-2 mb-1 border border-gray-300 rounded"
      />
      {passwordError && <p className="text-red-500 text-sm mb-4">{passwordError}</p>}
      <input
        type="password"
        name="confirmPassword"
        placeholder="Подтверждение пароля*"
        value={formData.confirmPassword}
        onChange={handleInputChange}
        className="w-full p-2 mb-4 border border-gray-300 rounded"
      />
      <input
        type="text"
        name="firstName"
        placeholder="Имя*"
        value={formData.firstName}
        onChange={handleInputChange}
        className="w-full p-2 mb-4 border border-gray-300 rounded"
      />
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
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
      >
        Зарегистрироваться
      </button>
    </form>
  );
}

export default RegistrationForm;
