import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import LoginForm from './components/LoginForm';
import RegistrationForm from './components/RegistrationForm';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
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
      </Routes>
    </Router>
  );
}

export default App;
