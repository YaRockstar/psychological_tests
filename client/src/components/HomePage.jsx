import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { testAPI } from '../utils/api';

const HomePage = () => {
  const [popularTests, setPopularTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthor, setIsAuthor] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkUserStatus = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);

      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setIsAuthor(user.role === 'author');
        } catch (error) {
          console.error('Ошибка при проверке роли пользователя:', error);
        }
      }
    };

    checkUserStatus();
  }, []);

  useEffect(() => {
    const fetchPopularTests = async () => {
      if (isAuthor) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await testAPI.getPublicTests();
        setPopularTests(response.data);
      } catch (error) {
        console.error('Ошибка при загрузке популярных тестов:', error);
        console.error(
          'Детали ошибки:',
          error.response ? error.response.data : 'Нет данных ответа'
        );
        setError('Не удалось загрузить популярные тесты');
      } finally {
        setLoading(false);
      }
    };

    fetchPopularTests();
  }, [isAuthor]);

  const getTestTime = questionsCount => {
    const minutes = Math.max(Math.ceil(questionsCount * 0.5), 5);
    return `${minutes} минут`;
  };

  const getTestImage = test => {
    if (test.imageUrl && test.imageUrl.trim() !== '') {
      return test.imageUrl;
    }

    const defaultImages = {
      personality: [
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3',
        'https://images.unsplash.com/photo-1522556189639-b150ed9c4330?ixlib=rb-4.0.3',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3',
      ],
      iq: [
        'https://images.unsplash.com/photo-1456406644174-8ddd4cd52a06?ixlib=rb-4.0.3',
        'https://images.unsplash.com/photo-1509228468518-180dd4864904?ixlib=rb-4.0.3',
        'https://images.unsplash.com/photo-1544134242-1e8403022e9f?ixlib=rb-4.0.3',
        'https://images.unsplash.com/photo-1532153955177-f59af40d6472?ixlib=rb-4.0.3',
        'https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3',
      ],
      emotional: [
        'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3',
        'https://images.unsplash.com/photo-1531747118685-ca8fa6e08806?ixlib=rb-4.0.3',
        'https://images.unsplash.com/photo-1531983412531-1f49a365ffed?ixlib=rb-4.0.3',
        'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?ixlib=rb-4.0.3',
        'https://images.unsplash.com/photo-1517677129300-07b130802f46?ixlib=rb-4.0.3',
      ],
      aptitude: [
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3',
        'https://images.unsplash.com/photo-1501139083538-0139583c060f?ixlib=rb-4.0.3',
        'https://images.unsplash.com/photo-1580894732930-0babd100d356?ixlib=rb-4.0.3',
        'https://images.unsplash.com/photo-1497493292307-31c376b6e479?ixlib=rb-4.0.3',
        'https://images.unsplash.com/photo-1519689680058-324335c77eba?ixlib=rb-4.0.3',
      ],
      career: [
        'https://images.unsplash.com/photo-1553272725-086100aecf5e?ixlib=rb-4.0.3',
        'https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3',
        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?ixlib=rb-4.0.3',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3',
        'https://images.unsplash.com/photo-1560179707-f14e90ef3623?ixlib=rb-4.0.3',
      ],
    };

    // Выбираем случайную картинку из массива для данного типа теста
    const imagesForType = defaultImages[test.testType] || [
      'https://images.unsplash.com/photo-1580894742597-87bc8789db3d?ixlib=rb-4.0.3',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3',
      'https://images.unsplash.com/photo-1579546929662-711aa81148cf?ixlib=rb-4.0.3',
      'https://images.unsplash.com/photo-1516796181074-bf453fbfa3e6?ixlib=rb-4.0.3',
      'https://images.unsplash.com/photo-1520262454473-a1a82276a574?ixlib=rb-4.0.3',
    ];

    // Используем id теста для детерминированного выбора картинки
    const testIdSum = test._id
      .split('')
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const imageIndex = testIdSum % imagesForType.length;

    return imagesForType[imageIndex];
  };

  const renderAuthorContent = () => (
    <div className="text-center py-12 mb-16">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Создание тестов</h2>
        <p className="text-gray-600 mb-8">
          Как автор, вы можете создавать и публиковать собственные психологические тесты.
          Начните прямо сейчас!
        </p>
        <Link
          to="/tests/create"
          className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition"
        >
          Создать новый тест
        </Link>
      </div>
    </div>
  );

  const renderUserContent = () => (
    <>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Популярные тесты</h2>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">Загрузка тестов...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
          <p>{error}</p>
        </div>
      ) : popularTests.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow-md mb-8">
          <p className="text-gray-600">В данный момент тесты не доступны</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {popularTests.map(test => (
            <div
              key={test._id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="h-48 bg-gray-200 overflow-hidden">
                <img
                  src={getTestImage(test)}
                  alt={test.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{test.title}</h3>
                <p className="text-gray-600 mb-4">{test.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {getTestTime(test.questionsCount || 10)}
                  </span>
                  <Link
                    to={`/test/${test._id}`}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                  >
                    Пройти тест
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const renderCallToAction = () => {
    if (isLoggedIn) return null;

    return (
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
    );
  };

  return (
    <>
      <div className="py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Платформа психологических тестов
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Пройдите наши научно обоснованные тесты, чтобы лучше понять себя и улучшить
            качество своей жизни
          </p>
        </div>

        {isAuthor ? renderAuthorContent() : renderUserContent()}

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

        {renderCallToAction()}
      </div>
    </>
  );
};

export default HomePage;
