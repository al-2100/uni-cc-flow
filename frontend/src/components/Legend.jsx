import { Panel } from 'reactflow';
import './Legend.css';

export default function Legend() {
  return (
    <Panel position="top-left" className="legend">
      <strong>Leyenda:</strong>
      <div className="legend__item">
        <div className="legend__color legend__color--aprobado" />
        Aprobado
      </div>
      <div className="legend__item">
        <div className="legend__color legend__color--pendiente" />
        Pendiente
      </div>
    </Panel>
  );
}
