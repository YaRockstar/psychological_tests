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
              <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-24">
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
                className="w-full px-4 sm:px-6 py-6 flex justify-center items-center"
                style={{ minHeight: 'calc(100vh - 200px)' }}
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
                className="w-full px-4 sm:px-6 py-6 flex justify-center items-center"
                style={{ minHeight: 'calc(100vh - 200px)' }}
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
