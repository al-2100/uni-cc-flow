import { Panel } from 'reactflow';
import './Legend.css';

export default function Legend() {
  return (
    <Panel position="bottom-left" className="legend">
      <strong>Leyenda</strong>
      <div className="legend__item">
        <div className="legend__color legend__color--aprobado" />
        Aprobado
      </div>
      <div className="legend__item">
        <div className="legend__color legend__color--desaprobado" />
        Desaprobado
      </div>
      <div className="legend__item">
        <div className="legend__color legend__color--disponible" />
        Disponible
      </div>
      <div className="legend__item">
        <div className="legend__color legend__color--bloqueado" />
        Bloqueado
      </div>
    </Panel>
  );
}
