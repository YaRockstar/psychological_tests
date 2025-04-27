import React from 'react';

function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-16">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-24">
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
  );
}

export default Footer;
