import './Header.css';

export default function Header({ user, onLogin, onLogout, onSync }) {
  return (
    <header className="header">
      <div className="header__left">
        <h2 className="header__title">Malla Curricular CC - UNI</h2>
        <span className="header__badge">
          {user ? user.email : "Modo Invitado"}
        </span>
      </div>

      <div className="header__actions">
        <button onClick={onSync} className="btn btn--secondary">
          Guardar en Nube
        </button>
        {user ? (
          <button onClick={onLogout} className="btn btn--secondary">
            Cerrar Sesion
          </button>
        ) : (
          <button onClick={onLogin} className="btn btn--primary">
            Iniciar Sesion
          </button>
        )}
      </div>
    </header>
  );
}
