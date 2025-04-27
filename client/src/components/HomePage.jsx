import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  const [userName, setUserName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Проверяем авторизацию пользователя при загрузке страницы
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      // Здесь в будущем можно добавить запрос данных пользователя
      // чтобы отобразить его имя после входа
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserName('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100">
      {/* Навигационная панель */}
      <nav className="bg-white shadow-md py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-indigo-600">
            PsyTests
          </Link>
          <div className="flex items-center space-x-6">
            {isLoggedIn ? (
              <>
                <span className="text-gray-700">
                  Привет, {userName || 'пользователь'}!
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition"
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Войти
                </Link>
                <Link
                  to="/register"
                  className="text-sm px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition"
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Основной контент */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Платформа психологических тестов
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Пройдите наши научно обоснованные тесты, чтобы лучше понять себя и улучшить
            качество своей жизни
          </p>
        </div>

        {/* Карточки популярных тестов */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Популярные тесты</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {[
            {
              id: 1,
              title: 'Тест на тип личности',
              description:
                'Узнайте свой психологический тип и как он влияет на ваше поведение.',
              image:
                'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3',
              time: '10 минут',
            },
            {
              id: 2,
              title: 'Тест на уровень тревожности',
              description: 'Измерьте уровень своей тревожности и получите рекомендации.',
              image:
                'https://images.unsplash.com/photo-1553272725-086100aecf5e?ixlib=rb-4.0.3',
              time: '5 минут',
            },
            {
              id: 3,
              title: 'Эмоциональный интеллект',
              description: 'Определите свою способность понимать эмоции и управлять ими.',
              image:
                'https://images.unsplash.com/photo-1523803326055-13109e8eea26?ixlib=rb-4.0.3',
              time: '15 минут',
            },
          ].map(test => (
            <div
              key={test.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="h-48 bg-gray-200 overflow-hidden">
                <img
                  src={test.image}
                  alt={test.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{test.title}</h3>
                <p className="text-gray-600 mb-4">{test.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{test.time}</span>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">
                    Пройти тест
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Секция "О платформе" */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">О нашей платформе</h2>
          <p className="text-gray-600 mb-6">
            Платформа психологических тестов предлагает широкий спектр научно обоснованных
            психологических инструментов для самопознания и личностного роста. Наши тесты
            разработаны профессиональными психологами и основаны на современных
            исследованиях в области психологии.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-indigo-50 rounded">
              <h3 className="font-bold text-indigo-700 mb-2">Достоверность</h3>
              <p className="text-gray-700">
                Все тесты основаны на научных исследованиях и прошли проверку
              </p>
            </div>
            <div className="p-4 bg-indigo-50 rounded">
              <h3 className="font-bold text-indigo-700 mb-2">Конфиденциальность</h3>
              <p className="text-gray-700">
                Мы гарантируем защиту ваших личных данных и результатов тестов
              </p>
            </div>
            <div className="p-4 bg-indigo-50 rounded">
              <h3 className="font-bold text-indigo-700 mb-2">Практическая польза</h3>
              <p className="text-gray-700">
                Каждый тест сопровождается рекомендациями по применению результатов
              </p>
            </div>
          </div>
        </div>

        {/* Блок призыва к действию */}
        <div className="text-center bg-indigo-600 text-white rounded-lg p-8">
          <h2 className="text-3xl font-bold mb-4">Готовы начать своё путешествие?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Зарегистрируйтесь сейчас и получите доступ ко всем нашим тестам и материалам
          </p>
          <Link
            to="/register"
            className="inline-block px-6 py-3 bg-white text-indigo-600 rounded-lg font-bold hover:bg-gray-100 transition"
          >
            Создать аккаунт
          </Link>
        </div>
      </div>

      {/* Подвал */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">PsyTests</h3>
              <p className="text-gray-400">
                Платформа психологических тестов для личностного роста и самопознания
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Ссылки</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    О нас
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    Контакты
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    Политика конфиденциальности
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Контакты</h3>
              <p className="text-gray-400 mb-2">Email: info@psytests.ru</p>
              <p className="text-gray-400">Телефон: +7 (123) 456-78-90</p>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
            &copy; {new Date().getFullYear()} PsyTests. Все права защищены.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
