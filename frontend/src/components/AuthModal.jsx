import { useState } from 'react';
import './AuthModal.css';

export default function AuthModal({ isOpen, onClose, onLogin, onRegister }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLoginMode) {
        await onLogin(email, password);
      } else {
        await onRegister(email, password);
      }
      onClose();
    } catch (err) {
      let message = 'Error de conexión';
      
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        // Si es un array (Error 422 de Pydantic/FastAPI)
        if (Array.isArray(detail)) {
            message = detail[0].msg;
        } else {
            message = detail;
        }
      }
      
      setError(message);
    } finally {
      setLoading(false);
    }
};

  return (
    <div className="overlay">
      <div className="modal">
        <button onClick={onClose} className="modal__close">✕</button>
        
        <h2 className="modal__title">
          {isLoginMode ? 'Iniciar Sesion' : 'Crear Cuenta'}
        </h2>
        
        <form onSubmit={handleSubmit} className="modal__form">
          <input
            type="email"
            placeholder="Email institucional"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="modal__input"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="modal__input"
            required
            minLength={6}
          />
          
          {error && <p className="modal__error">{error}</p>}
          
          <button type="submit" className="modal__submit" disabled={loading}>
            {loading ? 'Cargando...' : (isLoginMode ? 'Ingresar' : 'Registrarse')}
          </button>
        </form>

        <p className="modal__switch">
          {isLoginMode ? 'No tienes cuenta? ' : 'Ya tienes cuenta? '}
          <button 
            onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }} 
            className="modal__switch-btn"
          >
            {isLoginMode ? 'Registrate' : 'Inicia Sesion'}
          </button>
        </p>
      </div>
    </div>
  );
}
