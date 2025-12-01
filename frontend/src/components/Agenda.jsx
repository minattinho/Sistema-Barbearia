import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../api";

function Agenda() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    loadAppointments();
  }, [selectedDate]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await api.get("/api/appointments/all");

      // Filtrar agendamentos do dia selecionado
      const selectedDateObj = new Date(selectedDate + "T00:00:00");
      const startOfDay = new Date(selectedDateObj);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDateObj);
      endOfDay.setHours(23, 59, 59, 999);

      const dayAppointments = data.filter((appt) => {
        const apptDate = new Date(appt.scheduledAt);
        return (
          apptDate >= startOfDay &&
          apptDate <= endOfDay &&
          appt.status !== "cancelled"
        );
      });

      // Ordenar por horário
      dayAppointments.sort((a, b) => {
        return new Date(a.scheduledAt) - new Date(b.scheduledAt);
      });

      setAppointments(dayAppointments);
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
      toast.error("Erro ao carregar agendamentos do dia.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      scheduled: "Aguardando",
      accepted: "Aceito",
      rejected: "Recusado",
      completed: "Concluído",
      cancelled: "Cancelado",
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    const classMap = {
      scheduled: "status-scheduled",
      accepted: "status-accepted",
      rejected: "status-rejected",
      completed: "status-completed",
      cancelled: "status-cancelled",
    };
    return classMap[status] || "";
  };

  const handleStatusChange = async (appointmentId, nextStatus) => {
    try {
      setUpdatingId(appointmentId);
      await api.patch(`/api/appointments/${appointmentId}/status`, {
        status: nextStatus,
      });
      await loadAppointments();
      toast.success(`Agendamento ${getStatusLabel(nextStatus).toLowerCase()}.`);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error(
        error?.message || "Não foi possível atualizar o status do agendamento."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const renderActions = (appt) => {
    if (appt.status === "scheduled") {
      return (
        <div className="agenda-actions">
          <button
            className="btn-agenda btn-accept"
            disabled={updatingId === appt.id}
            onClick={() => handleStatusChange(appt.id, "accepted")}
          >
            Aceitar
          </button>
          <button
            className="btn-agenda btn-reject"
            disabled={updatingId === appt.id}
            onClick={() => handleStatusChange(appt.id, "rejected")}
          >
            Recusar
          </button>
        </div>
      );
    }

    if (appt.status === "accepted") {
      return (
        <div className="agenda-actions">
          <button
            className="btn-agenda btn-complete"
            disabled={updatingId === appt.id}
            onClick={() => handleStatusChange(appt.id, "completed")}
          >
            Finalizar atendimento
          </button>
        </div>
      );
    }

    return null;
  };

  const today = new Date().toISOString().split("T")[0];
  const isToday = selectedDate === today;

  return (
    <div className="agenda-module">
      <div className="agenda-header">
        <h2 className="agenda-title">AGENDA DO DIA</h2>
        <div className="agenda-date-selector">
          <label htmlFor="date-selector">Data:</label>
          <input
            id="date-selector"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-input"
          />
          {!isToday && (
            <button
              className="btn-today"
              onClick={() => setSelectedDate(today)}
            >
              Hoje
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="agenda-loading">
          <p>Carregando agendamentos...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="agenda-empty">
          <p>
            Nenhum agendamento para{" "}
            {isToday ? "hoje" : formatDate(selectedDate)}.
          </p>
        </div>
      ) : (
        <div className="agenda-list">
          {appointments.map((appt) => (
            <div
              key={appt.id}
              className={`agenda-card ${getStatusClass(appt.status)}`}
            >
              <div className="agenda-card-header">
                <div className="agenda-time">
                  <span className="time-value">
                    {formatTime(appt.scheduledAt)}
                  </span>
                </div>
                <span
                  className={`status-badge-agenda ${getStatusClass(
                    appt.status
                  )}`}
                >
                  {getStatusLabel(appt.status)}
                </span>
              </div>
              <div className="agenda-card-body">
                {appt.client && (
                  <div className="agenda-client">
                    <strong>Cliente:</strong> {appt.client.name}
                  </div>
                )}
                {appt.service && (
                  <div className="agenda-service">
                    <h3>{appt.service.name}</h3>
                    {appt.service.durationMinutes && (
                      <p className="service-duration">
                        Duração: {appt.service.durationMinutes} min
                      </p>
                    )}
                    {appt.service.price && (
                      <p className="service-price">
                        R$ {appt.service.price.toFixed(2).replace(".", ",")}
                      </p>
                    )}
                  </div>
                )}
                {renderActions(appt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Agenda;
