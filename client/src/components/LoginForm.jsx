import React, { useState } from 'react';

function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [isAuthor, setIsAuthor] = useState(false);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = () => {
    setIsAuthor(!isAuthor);
  };

  const handleSubmit = e => {
    e.preventDefault();
    // Добавьте логику валидации и отправки данных
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg shadow-md w-full max-w-md"
    >
      <h2 className="text-2xl font-bold mb-4 text-center">Авторизация</h2>
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
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
      >
        Войти
      </button>
    </form>
  );
}

export default LoginForm;
