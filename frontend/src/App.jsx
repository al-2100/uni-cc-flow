import { useEffect, useCallback, useState } from 'react';
import ReactFlow, { 
  Controls, 
  Background, 
  MiniMap, 
  useNodesState, 
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';

// API, Hooks & Components
import { graphService } from './api';
import { useAuth, useProgress, getNodeStyle, calculateNodeStates } from './hooks/useAuth';
import AuthModal from './components/AuthModal';
import Toast from './components/Toast';
import Header from './components/Header';
import Legend from './components/Legend';
import CoursePanel from './components/CoursePanel';

// ==================== COMPONENT ====================

export default function App() {
  // Estados del grafo
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loadingGraph, setLoadingGraph] = useState(true);
  
  // Hooks personalizados
  const { user, login, register, logout } = useAuth();
  const { loadCloudProgress, syncWithCloud, updateLocalProgress, getLocalProgress } = useProgress(setNodes);
  
  // UI State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [selectedCourse, setSelectedCourse] = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });
  const hideToast = () => setToast({ message: '', type: 'success' });

  // --- 1. CARGAR GRAFO ---
  useEffect(() => {
    const loadGraph = async () => {
      try {
        const { nodes: apiNodes, edges: apiEdges } = await graphService.getGraph();
        const localProgress = getLocalProgress();
        
        // Calcular estados usando el algoritmo
        const calculatedStates = calculateNodeStates(apiNodes, localProgress);

        const styledNodes = apiNodes.map((node) => {
          const status = calculatedStates[node.id] || 'bloqueado';
          return {
            ...node,
            style: getNodeStyle(status),
            data: { ...node.data, status }
          };
        });

        setNodes(styledNodes);
        setEdges(apiEdges);
      } catch (error) {
        console.error("Error cargando grafo:", error);
      } finally {
        setLoadingGraph(false);
      }
    };
    loadGraph();
  }, []);

  // --- 2. CARGAR PROGRESO AL INICIAR SESIÓN ---
  useEffect(() => {
    if (user) {
      loadCloudProgress();
    }
  }, [user]);

  // --- 3. HANDLERS ---
  const handleLogin = async (email, password) => {
    await login(email, password);
    const count = await loadCloudProgress();
    showToast(count > 0 
      ? `Bienvenido! Se recuperaron ${count} cursos de la nube.`
      : "Sesion iniciada. No tienes datos guardados aun."
    );
  };

  const handleRegister = async (email, password) => {
    await register(email, password);
    showToast("Cuenta creada exitosamente!");
  };

  const handleLogout = () => {
    logout();
    showToast("Sesion cerrada. Tus datos locales se mantienen.", "info");
  };

  const handleSync = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    try {
      const res = await syncWithCloud();
      showToast(res.message);
    } catch {
      showToast("Error sincronizando con el servidor.", "error");
    }
  };

  // --- 4. CLICK EN NODO (abre panel lateral) ---
  const onNodeClick = useCallback((event, node) => {
    setSelectedCourse(node);
  }, []);

  // --- 5. CAMBIAR ESTADO DESDE EL PANEL ---
  const handleChangeStatus = useCallback((course, newStatus) => {
    // Actualizar progreso local
    if (newStatus === 'disponible' || newStatus === 'bloqueado') {
      // Si el usuario quiere "quitar" el estado, lo ponemos como null para recalcular
      const progress = getLocalProgress();
      delete progress[course.id];
      localStorage.setItem('userProgress', JSON.stringify(progress));
    } else {
      updateLocalProgress(course.id, newStatus);
    }

    // Recalcular todos los estados del grafo
    setNodes((nds) => {
      const localProgress = getLocalProgress();
      const calculatedStates = calculateNodeStates(nds, localProgress);
      
      const updatedNodes = nds.map((n) => {
        const status = calculatedStates[n.id] || 'bloqueado';
        return {
          ...n,
          data: { ...n.data, status },
          style: getNodeStyle(status)
        };
      });

      // Actualizar el curso seleccionado
      const updatedSelected = updatedNodes.find(n => n.id === course.id);
      if (updatedSelected) {
        setSelectedCourse(updatedSelected);
      }

      return updatedNodes;
    });
  }, [setNodes, updateLocalProgress, getLocalProgress]);

  // --- RENDER ---
  if (loadingGraph) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Cargando Malla Curricular...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <Header 
        user={user} 
        onLogin={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onSync={handleSync}
      />

      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={() => setSelectedCourse(null)}
          fitView
          minZoom={0.1}
        >
          <Background color="#aaa" gap={16} />
          <Controls />
          <MiniMap 
            style={{ border: '1px solid #777' }} 
            nodeColor={(n) => {
              const status = n.data.status;
              if (status === 'aprobado') return '#28a745';
              if (status === 'desaprobado') return '#dc3545';
              if (status === 'disponible') return '#007bff';
              return '#6c757d';
            }} 
          />
          <Legend />
        </ReactFlow>

        {selectedCourse && (
          <CoursePanel 
            course={selectedCourse}
            onClose={() => setSelectedCourse(null)}
            onChangeStatus={handleChangeStatus}
            allNodes={nodes}
          />
        )}
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      {toast.message && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast} 
        />
      )}
    </div>
  );
}