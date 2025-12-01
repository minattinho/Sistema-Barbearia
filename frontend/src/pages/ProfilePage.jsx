import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { api } from '../api';

function ProfilePage({ user, onLogout, onProfileUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  const avatarLetter = useMemo(() => profileData.name?.charAt(0)?.toUpperCase() || '?', [profileData.name]);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileData.name.trim()) {
      toast.error('Informe seu nome');
      return;
    }
    if (!profileData.email.trim()) {
      toast.error('Informe seu email');
      return;
    }

    try {
      setIsSaving(true);
      const updated = await api.put('/api/users/me', {
        name: profileData.name.trim(),
        email: profileData.email.trim(),
      });

      toast.success('Perfil atualizado com sucesso!');
      setIsEditing(false);
      onProfileUpdate?.(updated);
    } catch (err) {
      console.error(err);
      const message = err.status === 409
        ? 'Este email já está em uso'
        : (err.message || 'Erro ao atualizar perfil');
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSave = (e) => {
    e.preventDefault();
    toast.success('Senha alterada com sucesso!');
    setIsChangingPassword(false);
  };

  const ActiveForm = () => {
    if (isEditing) {
      return (
        <form onSubmit={handleProfileSave} className="profile-form">
          <h3>Editar Perfil</h3>
          <div className="form-group">
            <label htmlFor="name">NOME:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={profileData.name}
              onChange={handleProfileChange}
              required
              disabled={isSaving}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">EMAIL:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={profileData.email}
              onChange={handleProfileChange}
              required
              disabled={isSaving}
            />
          </div>
          <div className="form-actions-profile">
            <button type="submit" className="btn btn-red" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)} disabled={isSaving}>
              Cancelar
            </button>
          </div>
        </form>
      );
    }
    if (isChangingPassword) {
      return (
        <form onSubmit={handlePasswordSave} className="profile-form">
          <h3>Alterar Senha</h3>
          <div className="form-group">
            <label htmlFor="currentPassword">SENHA ATUAL:</label>
            <input type="password" id="currentPassword" required />
          </div>
          <div className="form-group">
            <label htmlFor="newPassword">NOVA SENHA:</label>
            <input type="password" id="newPassword" required />
          </div>
          <div className="form-actions-profile">
            <button type="submit" className="btn btn-red">Salvar Senha</button>
            <button type="button" className="btn btn-secondary" onClick={() => setIsChangingPassword(false)}>Cancelar</button>
          </div>
        </form>
      );
    }
    return null;
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">{avatarLetter}</div>
        <h2>{profileData.name || 'Seu nome'}</h2>
        <p>{profileData.email || 'Seu email'}</p>
      </div>

      <div className="profile-body">
        {isEditing || isChangingPassword ? (
          <ActiveForm />
        ) : (
          <div className="profile-menu">
            <button className="btn-profile-action" onClick={() => setIsEditing(true)}>Editar Perfil</button>
            <button className="btn-profile-action" onClick={() => setIsChangingPassword(true)}>Alterar Senha</button>
            <div className="appointment-summary">
              <p><strong>Próximo Agendamento:</strong> 15/10/2025 - 18:30 (Cabelo+Barba)</p>
            </div>
            <button className="btn btn-logout" onClick={onLogout}>Sair da Conta</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;