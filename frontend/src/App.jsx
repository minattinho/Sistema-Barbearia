import React, { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Header from "./components/Header";
import LoginPage from "./pages/LoginPage";
import CreateAccountPage from "./pages/CreateAccountPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import HomePage from "./pages/HomePage";
import ServicesPage from "./pages/ServicesPage";
import AppointmentPage from "./pages/AppointmentPage";
import MyAppointmentsPage from "./pages/MyAppointmentsPage";
import ProfilePage from "./pages/ProfilePage";
import "./index.css";
import { api } from "./api";

function App() {
  const [appState, setAppState] = useState({
    isLoggedIn: false,
    currentPage: "login",
    user: null,
    activeModule: "agenda", // Módulo ativo para barbeiro
  });

  const navigate = (page) => {
    setAppState((prevState) => ({ ...prevState, currentPage: page }));
  };

  const setActiveModule = (module) => {
    setAppState((prevState) => ({ ...prevState, activeModule: module }));
  };

  const handleLogin = (userData) => {
    // Redireciona barbeiro para painel próprio
    if (userData && userData.role === "barbeiro") {
      setAppState({
        isLoggedIn: true,
        currentPage: "horariosBarbeiro",
        user: userData,
        activeModule: "agenda",
      });
    } else {
      setAppState({ isLoggedIn: true, currentPage: "inicio", user: userData });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAppState({ isLoggedIn: false, currentPage: "login", user: null });
  };

  const handleProfileUpdated = (updatedUser) => {
    setAppState((prev) => ({
      ...prev,
      user: { ...prev.user, ...updatedUser },
    }));
  };

  // Restaurar sessão se token existir
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const profile = await api.get("/api/users/me");
        if (cancelled) return;

        setAppState((prev) => ({
          ...prev,
          isLoggedIn: true,
          user: profile,
          currentPage:
            profile?.role === "barbeiro" ? "horariosBarbeiro" : "inicio",
        }));
      } catch (err) {
        console.error("Erro ao restaurar sessão:", err);
        localStorage.removeItem("token");
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const renderContent = () => {
    const { isLoggedIn, currentPage, user } = appState;

    if (!isLoggedIn) {
      switch (currentPage) {
        case "createAccount":
          return <CreateAccountPage onNavigate={navigate} />;
        case "forgotPassword":
          return <ForgotPasswordPage onNavigate={navigate} />;
        default:
          return <LoginPage onLogin={handleLogin} onNavigate={navigate} />;
      }
    }

    switch (currentPage) {
      case "inicio":
        return <HomePage onNavigate={navigate} />;
      case "servicos":
        return <ServicesPage onNavigate={navigate} />;
      case "agendamento":
        return <AppointmentPage />;
      case "meusHorarios":
        return <MyAppointmentsPage user={user} />;
      case "profile":
        return (
          <ProfilePage
            user={user}
            onLogout={handleLogout}
            onProfileUpdate={handleProfileUpdated}
          />
        );
      case "horariosBarbeiro":
        return (
          <MyAppointmentsPage
            user={user}
            barbeiro
            activeModule={appState.activeModule}
          />
        );
      default:
        return <HomePage onNavigate={navigate} />;
    }
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      {appState.isLoggedIn && (
        <Header
          user={appState.user}
          currentPage={appState.currentPage}
          setCurrentPage={navigate}
          activeModule={appState.activeModule}
          setActiveModule={setActiveModule}
        />
      )}
      {/* ⬅️ CORREÇÃO: Usando a classe 'main-content' que contém as regras de layout Flexbox/Centralização */}
      <main className="main-content">{renderContent()}</main>
    </>
  );
}

export default App;