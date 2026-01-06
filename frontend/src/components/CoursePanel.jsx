import { useMemo } from 'react';
import { calculateImpact } from '../hooks/useAuth';
import './CoursePanel.css';

export default function CoursePanel({ course, onClose, onChangeStatus, allNodes }) {
  if (!course) return null;

  const { id, data } = course;
  const { name, credits, cycle, prerequisites, status } = data;

  // Calcular impacto de desaprobar este curso
  const impact = useMemo(() => {
    if (!allNodes || allNodes.length === 0) return null;
    return calculateImpact(id, allNodes);
  }, [id, allNodes]);

  // Determinar qué botones mostrar según el estado
  const renderStatusButtons = () => {
    switch (status) {
      case 'aprobado':
        return (
          <>
            <button 
              className="course-panel__status-btn course-panel__status-btn--desaprobado"
              onClick={() => onChangeStatus(course, 'desaprobado')}
            >
              Marcar como Desaprobado
            </button>
            <button 
              className="course-panel__status-btn course-panel__status-btn--reset"
              onClick={() => onChangeStatus(course, 'disponible')}
            >
              Quitar estado
            </button>
          </>
        );
      case 'desaprobado':
        return (
          <>
            <button 
              className="course-panel__status-btn course-panel__status-btn--aprobado"
              onClick={() => onChangeStatus(course, 'aprobado')}
            >
              Marcar como Aprobado
            </button>
            <button 
              className="course-panel__status-btn course-panel__status-btn--reset"
              onClick={() => onChangeStatus(course, 'disponible')}
            >
              Quitar estado
            </button>
          </>
        );
      case 'disponible':
        return (
          <>
            <button 
              className="course-panel__status-btn course-panel__status-btn--aprobado"
              onClick={() => onChangeStatus(course, 'aprobado')}
            >
              Marcar como Aprobado
            </button>
            <button 
              className="course-panel__status-btn course-panel__status-btn--desaprobado"
              onClick={() => onChangeStatus(course, 'desaprobado')}
            >
              Marcar como Desaprobado
            </button>
          </>
        );
      case 'bloqueado':
      default:
        return (
          <p className="course-panel__blocked-msg">
            Debes aprobar los prerrequisitos primero
          </p>
        );
    }
  };

  return (
    <div className="course-panel">
      {/* Header */}
      <div className="course-panel__header">
        <div className="course-panel__title">
          <h2 className="course-panel__code">{id}</h2>
          <p className="course-panel__name">{name}</p>
        </div>
        <button className="course-panel__close" onClick={onClose} title="Cerrar">
          ×
        </button>
      </div>

      {/* Status Badge */}
      <div className={`course-panel__status-badge course-panel__status-badge--${status}`}>
        {status === 'aprobado' && 'Aprobado'}
        {status === 'desaprobado' && 'Desaprobado'}
        {status === 'disponible' && 'Disponible'}
        {status === 'bloqueado' && 'Bloqueado'}
      </div>

      {/* Content */}
      <div className="course-panel__content">
        {/* Créditos */}
        <div className="course-panel__info-row">
          <div className="course-panel__info-text">
            <span className="course-panel__info-label">Créditos</span>
            <span className="course-panel__info-value">{credits} créditos</span>
          </div>
        </div>

        {/* Ciclo */}
        <div className="course-panel__info-row">
          <div className="course-panel__info-text">
            <span className="course-panel__info-label">Ciclo</span>
            <span className="course-panel__info-value">{cycle}° ciclo</span>
          </div>
        </div>

        {/* Prerrequisitos */}
        <div className="course-panel__section">
          <h3 className="course-panel__section-title">Prerrequisitos</h3>
          {prerequisites && prerequisites.length > 0 ? (
            <ul className="course-panel__prereq-list">
              {prerequisites.map((prereq) => (
                <li key={prereq.id} className="course-panel__prereq-item">
                  <strong>{prereq.id}</strong> - {prereq.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="course-panel__no-prereq">Sin prerrequisitos</p>
          )}
        </div>

        {/* Análisis de Impacto */}
        {impact && impact.count > 0 && (
          <div className="course-panel__section course-panel__impact">
            <h3 className="course-panel__section-title course-panel__impact-title">
              Análisis de Impacto
            </h3>
            <p className="course-panel__impact-warning">
              Si desapruebas este curso, se bloquearían:
            </p>
            
            <div className="course-panel__impact-stats">
              <div className="course-panel__impact-stat">
                <span className="course-panel__impact-number">{impact.count}</span>
                <span className="course-panel__impact-label">cursos</span>
              </div>
              <div className="course-panel__impact-stat">
                <span className="course-panel__impact-number">{impact.totalCredits}</span>
                <span className="course-panel__impact-label">créditos</span>
              </div>
              <div className="course-panel__impact-stat">
                <span className="course-panel__impact-number">{impact.affectedCycles.length}</span>
                <span className="course-panel__impact-label">ciclos</span>
              </div>
            </div>

            <details className="course-panel__impact-details">
              <summary>Ver cursos afectados</summary>
              <ul className="course-panel__impact-list">
                {impact.affectedCourses.map((c) => (
                  <li key={c.id} className="course-panel__impact-item">
                    <strong>{c.id}</strong> - {c.name}
                    <span className="course-panel__impact-cycle">Ciclo {c.cycle}</span>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        )}

        {impact && impact.count === 0 && (
          <div className="course-panel__section course-panel__impact course-panel__impact--safe">
            <h3 className="course-panel__section-title">Análisis de Impacto</h3>
            <p className="course-panel__impact-safe-msg">
              Este curso no bloquea ningún otro curso posterior.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="course-panel__footer">
        {renderStatusButtons()}
      </div>
    </div>
  );
}
