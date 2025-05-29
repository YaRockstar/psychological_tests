import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { groupAPI, userAPI } from '../utils/api';

function AuthorGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(''); // eslint-disable-line no-unused-vars
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState({});
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [editingGroup, setEditingGroup] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [groupMembers, setGroupMembers] = useState({}); // Информация о пользователях по группам
  const [selectedMember, setSelectedMember] = useState(null); // Выбранный пользователь для просмотра деталей

  useEffect(() => {
    // Проверяем авторизацию
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }

    setIsLoggedIn(true);

    // Получаем роль пользователя и группы
    const fetchUserDataAndGroups = async () => {
      try {
        // Проверяем роль пользователя
        const userData = localStorage.getItem('userData');
        if (userData) {
          try {
            const parsedData = JSON.parse(userData);
            setUserRole(parsedData.role || '');

            // Если пользователь - автор, загружаем его группы
            if (parsedData.role === 'author') {
              console.log('Пользователь является автором, загружаем группы');
              await fetchAuthorGroups();
            }
          } catch (error) {
            console.error('Ошибка при парсинге данных пользователя:', error);
          }
        }

        // Проверяем на сервере
        const response = await userAPI.getCurrentUser();
        console.log('Данные пользователя с сервера:', response.data);
        setUserRole(response.data.role || '');

        // Если пользователь - автор, загружаем его группы
        if (response.data.role === 'author') {
          console.log('Пользователь является автором по данным сервера');
          await fetchAuthorGroups();
        } else {
          console.log('Пользователь НЕ является автором:', response.data.role);
          setLoading(false);
        }
      } catch (err) {
        console.error('Ошибка при получении данных пользователя:', err);
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
          setIsLoggedIn(false);
        } else {
          setError(
            'Ошибка при загрузке данных пользователя. Пожалуйста, попробуйте позже.'
          );
          setLoading(false);
        }
      }
    };

    // Загружаем группы автора
    const fetchAuthorGroups = async () => {
      try {
        setLoading(true);
        const response = await groupAPI.getAuthorGroups();
        const groupsData = response.data;
        setGroups(groupsData);

        // Загружаем информацию о членах групп
        await loadGroupMembersInfo(groupsData);

        setLoading(false);
      } catch (error) {
        console.error('Ошибка при загрузке групп:', error);
        setError('Не удалось загрузить группы. Пожалуйста, попробуйте позже.');
        setLoading(false);
      }
    };

    fetchUserDataAndGroups();
  }, []);

  // Загрузка информации о пользователях в группах
  const loadGroupMembersInfo = async groupsData => {
    try {
      // Собираем уникальные ID пользователей из всех групп
      const allMemberIds = new Set();
      groupsData.forEach(group => {
        if (group.members && group.members.length > 0) {
          group.members.forEach(memberId => allMemberIds.add(memberId));
        }
      });

      console.log(`Загрузка данных для ${allMemberIds.size} участников групп`);

      // Получаем информацию о каждом пользователе
      const membersInfo = {};
      for (const memberId of allMemberIds) {
        try {
          const response = await userAPI.getUserById(memberId);
          console.log(`Получены данные пользователя ${memberId}:`, response.data);
          membersInfo[memberId] = response.data;
        } catch (error) {
          console.error(`Ошибка при загрузке данных пользователя ${memberId}:`, error);
          membersInfo[memberId] = { firstName: 'Неизвестный пользователь' };
        }
      }

      // Организуем данные пользователей по группам
      const groupMembersData = {};
      groupsData.forEach(group => {
        groupMembersData[group._id] = {};
        if (group.members && group.members.length > 0) {
          group.members.forEach(memberId => {
            groupMembersData[group._id][memberId] = membersInfo[memberId];
          });
        }
      });

      console.log('Загружены данные участников групп:', groupMembersData);
      setGroupMembers(groupMembersData);
    } catch (error) {
      console.error('Ошибка при загрузке данных участников групп:', error);
    }
  };

  // Получение имени пользователя по ID
  const getMemberName = (groupId, memberId) => {
    if (!memberId) return 'Неизвестный пользователь';
    if (!groupMembers[groupId] || !groupMembers[groupId][memberId]) return 'Загрузка...';

    const member = groupMembers[groupId][memberId];
    return (
      member.firstName || member.name || member.username || 'Неизвестный пользователь'
    );
  };

  // Показать информацию о пользователе
  const showMemberDetails = (groupId, memberId) => {
    if (groupMembers[groupId] && groupMembers[groupId][memberId]) {
      setSelectedMember(groupMembers[groupId][memberId]);
    }
  };

  // Закрыть модальное окно с информацией о пользователе
  const closeMemberDetails = () => {
    setSelectedMember(null);
  };

  // Если пользователь не авторизован, перенаправляем на страницу входа
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  // Если еще загружаются данные пользователя, показываем индикатор загрузки
  if (loading && !showCreateForm && !editingGroup) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Функция для создания новой группы
  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) {
      setError('Название группы обязательно');
      return;
    }

    try {
      setLoading(true);
      const response = await groupAPI.createGroup(newGroup);

      // Добавляем новую группу в список групп
      const updatedGroups = [response.data, ...groups];
      setGroups(updatedGroups);

      // Инициализируем данные участников для новой группы
      if (response.data.members && response.data.members.length > 0) {
        await loadGroupMembersInfo([response.data]);
      }

      setNewGroup({ name: '', description: '' });
      setShowCreateForm(false);
      setSuccessMessage('Группа успешно создана');
      setTimeout(() => setSuccessMessage(''), 3000);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка при создании группы:', error);
      setError(error.response?.data?.message || 'Не удалось создать группу');
      setLoading(false);
    }
  };

  // Функция для обновления группы
  const handleUpdateGroup = async () => {
    if (!editingGroup || !editingGroup.name.trim()) {
      setError('Название группы обязательно');
      return;
    }

    try {
      setLoading(true);
      const response = await groupAPI.updateGroup(editingGroup._id, {
        name: editingGroup.name,
        description: editingGroup.description,
      });

      // Обновляем группу в массиве
      const updatedGroups = groups.map(group =>
        group._id === editingGroup._id ? response.data : group
      );

      // Обновляем данные в случае изменения состава участников
      if (
        response.data.members &&
        JSON.stringify(response.data.members) !== JSON.stringify(editingGroup.members)
      ) {
        await loadGroupMembersInfo([response.data]);
      }

      setGroups(updatedGroups);
      setEditingGroup(null);
      setSuccessMessage('Группа успешно обновлена');
      setTimeout(() => setSuccessMessage(''), 3000);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка при обновлении группы:', error);
      setError(error.response?.data?.message || 'Не удалось обновить группу');
      setLoading(false);
    }
  };

  // Функция для удаления группы
  const handleDeleteGroup = async groupId => {
    if (!window.confirm('Вы уверены, что хотите удалить эту группу?')) {
      return;
    }

    try {
      setLoading(true);
      await groupAPI.deleteGroup(groupId);

      // Удаляем группу из массива
      const updatedGroups = groups.filter(group => group._id !== groupId);
      setGroups(updatedGroups);

      setSuccessMessage('Группа успешно удалена');
      setTimeout(() => setSuccessMessage(''), 3000);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка при удалении группы:', error);
      setError(error.response?.data?.message || 'Не удалось удалить группу');
      setLoading(false);
    }
  };

  // Функция для обновления кода приглашения
  const handleRegenerateInviteCode = async groupId => {
    try {
      setLoading(true);
      const response = await groupAPI.regenerateInviteCode(groupId);

      // Обновляем код приглашения в группе
      const updatedGroups = groups.map(group =>
        group._id === groupId ? { ...group, inviteCode: response.data.inviteCode } : group
      );

      setGroups(updatedGroups);

      // Показываем код пользователю
      setShowInviteCode({
        ...showInviteCode,
        [groupId]: true,
      });

      setSuccessMessage('Код приглашения обновлен');
      setTimeout(() => setSuccessMessage(''), 3000);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка при обновлении кода приглашения:', error);
      setError(error.response?.data?.message || 'Не удалось обновить код приглашения');
      setLoading(false);
    }
  };

  // Функция для удаления пользователя из группы
  const handleRemoveUserFromGroup = async (groupId, userId) => {
    const userName = getMemberName(groupId, userId);
    if (
      !window.confirm(
        `Вы уверены, что хотите удалить пользователя "${userName}" из группы?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await groupAPI.removeUserFromGroup(groupId, userId);

      // Обновляем группу в массиве
      const updatedGroups = groups.map(group =>
        group._id === groupId ? response.data : group
      );

      // Обновляем информацию о членах группы
      setGroupMembers(prevMembers => {
        const newMembers = { ...prevMembers };
        if (newMembers[groupId] && newMembers[groupId][userId]) {
          // Удаляем пользователя из списка участников группы
          const { [userId]: _, ...restMembers } = newMembers[groupId];
          newMembers[groupId] = restMembers;
        }
        return newMembers;
      });

      setGroups(updatedGroups);
      setSuccessMessage(`Пользователь ${userName} удален из группы`);
      setTimeout(() => setSuccessMessage(''), 3000);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка при удалении пользователя из группы:', error);
      setError(
        error.response?.data?.message || 'Не удалось удалить пользователя из группы'
      );
      setLoading(false);
    }
  };

  // Функция копирования кода приглашения
  const copyInviteLink = inviteCode => {
    const inviteLink = `${window.location.origin}/join/${inviteCode}`;
    navigator.clipboard
      .writeText(inviteLink)
      .then(() => {
        setSuccessMessage('Ссылка скопирована в буфер обмена');
        setTimeout(() => setSuccessMessage(''), 3000);
      })
      .catch(err => {
        console.error('Ошибка при копировании ссылки:', err);
        setError('Не удалось скопировать ссылку');
      });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Мои группы</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Создать группу
        </button>
      </div>

      {/* Сообщение об ошибке */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Сообщение об успешном действии */}
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Форма создания группы */}
      {showCreateForm && (
        <div className="bg-white shadow-md rounded-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Создание новой группы</h2>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Название группы*
            </label>
            <input
              type="text"
              value={newGroup.name}
              onChange={e => setNewGroup({ ...newGroup, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Введите название группы"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Описание группы
            </label>
            <textarea
              value={newGroup.description}
              onChange={e => setNewGroup({ ...newGroup, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Введите описание группы"
              rows="3"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateForm(false)}
              className="mr-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleCreateGroup}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              disabled={loading}
            >
              {loading ? 'Создание...' : 'Создать группу'}
            </button>
          </div>
        </div>
      )}

      {/* Форма редактирования группы */}
      {editingGroup && (
        <div className="bg-white shadow-md rounded-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Редактирование группы</h2>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Название группы*
            </label>
            <input
              type="text"
              value={editingGroup.name}
              onChange={e => setEditingGroup({ ...editingGroup, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Введите название группы"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Описание группы
            </label>
            <textarea
              value={editingGroup.description}
              onChange={e =>
                setEditingGroup({ ...editingGroup, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Введите описание группы"
              rows="3"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setEditingGroup(null)}
              className="mr-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleUpdateGroup}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              disabled={loading}
            >
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно с информацией о пользователе */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Информация о пользователе</h2>
              <button
                onClick={closeMemberDetails}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <p>
                <span className="font-medium">Имя:</span>{' '}
                {selectedMember.firstName || 'Не указано'}
              </p>
              {selectedMember.lastName && (
                <p>
                  <span className="font-medium">Фамилия:</span> {selectedMember.lastName}
                </p>
              )}
              {selectedMember.middleName && (
                <p>
                  <span className="font-medium">Отчество:</span>{' '}
                  {selectedMember.middleName}
                </p>
              )}
              <p>
                <span className="font-medium">Email:</span> {selectedMember.email}
              </p>
              {selectedMember.description && (
                <p>
                  <span className="font-medium">Описание:</span>{' '}
                  {selectedMember.description}
                </p>
              )}
              {selectedMember.birthDate && (
                <p>
                  <span className="font-medium">Дата рождения:</span>{' '}
                  {new Date(selectedMember.birthDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="mt-6">
              <button
                onClick={closeMemberDetails}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-6 text-center">
          <p className="text-gray-700">У вас еще нет созданных групп.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Создать первую группу
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {groups.map(group => (
            <div
              key={group._id}
              className="bg-white shadow-md rounded-md overflow-hidden"
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">{group.name}</h2>
                <p className="text-gray-600 mb-4">
                  {group.description || 'Нет описания'}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <p className="text-sm text-gray-500 mb-1">Код приглашения:</p>
                      {showInviteCode[group._id] ? (
                        <div className="flex items-center">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                            {group.inviteCode}
                          </code>
                          <button
                            onClick={() => copyInviteLink(group.inviteCode)}
                            className="ml-2 text-indigo-600 hover:text-indigo-800"
                            title="Копировать ссылку приглашения"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            setShowInviteCode({ ...showInviteCode, [group._id]: true })
                          }
                          className="text-indigo-600 hover:text-indigo-800 text-sm"
                        >
                          Показать код
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <p className="text-sm text-gray-500 mb-2">
                        Участники: {group.members?.length || 0}
                      </p>
                      {group.members && group.members.length > 0 && (
                        <div className="max-h-48 overflow-y-auto">
                          <ul className="text-sm">
                            {group.members.map(memberId => (
                              <li
                                key={memberId}
                                className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                              >
                                <span
                                  className="text-gray-700 cursor-pointer hover:text-indigo-600 font-medium"
                                  onClick={() => showMemberDetails(group._id, memberId)}
                                >
                                  {getMemberName(group._id, memberId)}
                                </span>
                                <button
                                  onClick={() =>
                                    handleRemoveUserFromGroup(group._id, memberId)
                                  }
                                  className="ml-2 flex items-center text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors"
                                  title="Удалить пользователя из группы"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <span className="text-xs">Удалить</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setEditingGroup(group)}
                    className="mr-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors text-sm"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleRegenerateInviteCode(group._id)}
                    className="mr-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors text-sm"
                  >
                    Новый код
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group._id)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AuthorGroups;
