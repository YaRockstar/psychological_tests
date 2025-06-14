import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import HomePage from './components/HomePage';
import Layout from './components/Layout';
import LoginForm from './components/LoginForm';
import ProfilePage from './components/ProfilePage';
import RegistrationForm from './components/RegistrationForm';
import TestCreate from './components/TestCreate';
import AuthorTests from './components/AuthorTests';
import TestEdit from './components/TestEdit';
import TestsList from './components/TestsList';
import TestTaking from './components/TestTaking';
import TestResults from './components/TestResults';
import TestHistory from './components/TestHistory';
import AuthRedirect from './components/AuthRedirect';
import AuthorGroups from './components/AuthorGroups';
import UserGroups from './components/UserGroups';
import JoinGroup from './components/JoinGroup';
import GroupResults from './components/GroupResults';
import AttemptDetails from './components/AttemptDetails';
import CreateGroup from './components/CreateGroup';
import CompareGroups from './components/CompareGroups';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthRedirect />} />
        <Route
          path="/home"
          element={
            <Layout>
              <div className="w-full px-4 sm:px-6 lg:px-8">
                <HomePage />
              </div>
            </Layout>
          }
        />
        <Route
          path="/login"
          element={
            <Layout>
              <div
                className="w-full px-4 sm:px-6 flex justify-center items-center"
                style={{ minHeight: 'calc(100vh - 350px)' }}
              >
                <LoginForm />
              </div>
            </Layout>
          }
        />
        <Route
          path="/register"
          element={
            <Layout>
              <div
                className="w-full px-4 sm:px-6 flex justify-center items-center"
                style={{ minHeight: 'calc(100vh - 350px)' }}
              >
                <RegistrationForm />
              </div>
            </Layout>
          }
        />
        <Route
          path="/profile"
          element={
            <Layout>
              <ProfilePage />
            </Layout>
          }
        />
        <Route
          path="/tests/create"
          element={
            <Layout>
              <TestCreate />
            </Layout>
          }
        />
        <Route
          path="/tests/my"
          element={
            <Layout>
              <AuthorTests />
            </Layout>
          }
        />
        <Route
          path="/tests/history"
          element={
            <Layout>
              <TestHistory />
            </Layout>
          }
        />
        <Route
          path="/test/:testId/edit"
          element={
            <Layout>
              <TestEdit />
            </Layout>
          }
        />
        <Route
          path="/tests"
          element={
            <Layout>
              <TestsList />
            </Layout>
          }
        />
        <Route
          path="/test/:testId"
          element={
            <Layout>
              <TestTaking />
            </Layout>
          }
        />
        <Route
          path="/test-results/:attemptId"
          element={
            <Layout>
              <TestResults />
            </Layout>
          }
        />
        <Route
          path="/groups"
          element={
            <Layout>
              <AuthorGroups />
            </Layout>
          }
        />
        <Route
          path="/my-groups"
          element={
            <Layout>
              <UserGroups />
            </Layout>
          }
        />
        <Route
          path="/join/:inviteCode"
          element={
            <Layout>
              <JoinGroup />
            </Layout>
          }
        />
        <Route
          path="/group/:groupId/results"
          element={
            <Layout>
              <GroupResults />
            </Layout>
          }
        />
        <Route
          path="/attempt-details/:attemptId"
          element={
            <Layout>
              <AttemptDetails />
            </Layout>
          }
        />
        <Route
          path="/create-group"
          element={
            <Layout>
              <CreateGroup />
            </Layout>
          }
        />
        <Route
          path="/compare-groups"
          element={
            <Layout>
              <CompareGroups />
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
