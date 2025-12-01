import React, { useState } from "react";
import { toast } from "react-toastify";
import Agenda from "../components/Agenda";
import KPIDashboard from "../components/KPIDashboard"; // ⬅️ NOVO: Importar Dashboard de KPI

// Componente para o toast de confirmação
const ConfirmToast = ({ closeToast, onConfirm }) => (
  <div className="confirm-toast">
    <p className="confirm-toast-message">Tem certeza que deseja cancelar?</p>
    <div className="confirm-toast-buttons">
      <button
        className="confirm-toast-btn confirm-toast-btn-yes"
        onClick={() => {
          onConfirm();
          closeToast();
        }}
      >
        SIM
      </button>
      <button
        className="confirm-toast-btn confirm-toast-btn-no"
        onClick={closeToast}
      >
        NÃO
      </button>
    </div>
  </div>
);

function AppointmentCard({ service, date, time, status, onCancel }) {
  return (
    <div className={`appointment-card ${status}`}>
      <div className="card-content">
        <h3>{service}</h3>
        <p>
          <strong>Data:</strong> {date}
        </p>
        <p>
          <strong>Horário:</strong> {time}
        </p>
      </div>
      <div className="card-footer">
        <span className="status-badge">
          {status === "confirmed" ? "Confirmado" : "Finalizado"}
        </span>
        {status === "confirmed" && (
          <button className="btn-cancel" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

function MyAppointmentsPage({ user, barbeiro, activeModule = "agenda" }) {
  // Se for barbeiro, mostrar todos os horários, caso contrário, apenas do cliente
  const initialAppointments = barbeiro
    ? []
    : [
        {
          id: 1,
          service: "Cabelo + Barba + Sombrancelha",
          date: "15/10/2025",
          time: "18:30",
          status: "accepted",
        },
        {
          id: 2,
          service: "Corte de Cabelo",
          date: "20/09/2025",
          time: "16:00",
          status: "completed",
        },
        {
          id: 3,
          service: "Corte de Barba",
          date: "01/09/2025",
          time: "11:00",
          status: "completed",
        },
      ];
  const [appointments, setAppointments] = useState(initialAppointments);

  const handleCancel = (appointmentId) => {
    const confirmCancellation = () => {
      setAppointments((currentAppointments) =>
        currentAppointments.filter((appt) => appt.id !== appointmentId)
      );
      toast.success("Agendamento cancelado.");
    };

    toast(<ConfirmToast onConfirm={confirmCancellation} />, {
      position: "top-center",
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      closeButton: false,
    });
  };

  // Se for barbeiro, mostrar interface modular
  if (barbeiro) {
    return (
      <div className="page-content barbeiro-page">
        <h1 className="page-title">PAINEL DO BARBEIRO</h1>
        <div className="barbeiro-modules">
          <div className="module-content">
            {activeModule === "agenda" && <Agenda />}
            {activeModule === "kpis" && <KPIDashboard />} {/* ⬅️ NOVO: Renderiza o módulo de KPIs */}
            {/* Adicionar mais módulos aqui no futuro */}
          </div>
        </div>
      </div>
    );
  }

  // Se for cliente, manter comportamento original
  return (
    <div className="page-content">
      <h1 className="page-title">Meus Horários</h1>
      <div className="appointments-list">
        {appointments.filter((a) => a.status === "accepted").length === 0 &&
          appointments.filter((a) => a.status === "completed").length > 0 && (
            <p className="info-message">
              Você não possui agendamentos futuros.
            </p>
          )}
        {appointments.length === 0 && (
          <p className="info-message">Você ainda não fez nenhum agendamento.</p>
        )}
        {appointments.map((appt) => (
          <div key={appt.id} className={`appointment-card ${appt.status}`}>
            <div className="card-content">
              <h3>{appt.service}</h3>
              <p>
                <strong>Data:</strong> {appt.date}
              </p>
              <p>
                <strong>Horário:</strong> {appt.time}
              </p>
            </div>
            <div className="card-footer">
              <span className="status-badge">
                {appt.status === "accepted" ? "Confirmado" : "Finalizado"}
              </span>
              {appt.status === "accepted" && (
                <button
                  className="btn-cancel"
                  onClick={() => handleCancel(appt.id)}
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyAppointmentsPage;