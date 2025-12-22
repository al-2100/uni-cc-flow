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
import { useAuth, useProgress, getNodeStyle } from './hooks/useAuth';
import AuthModal from './components/AuthModal';
import Toast from './components/Toast';
import Header from './components/Header';
import Legend from './components/Legend';

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

  const showToast = (message, type = 'success') => setToast({ message, type });
  const hideToast = () => setToast({ message: '', type: 'success' });

  // --- 1. CARGAR GRAFO ---
  useEffect(() => {
    const loadGraph = async () => {
      try {
        const { nodes: apiNodes, edges: apiEdges } = await graphService.getGraph();
        const localProgress = getLocalProgress();

        const styledNodes = apiNodes.map((node) => ({
          ...node,
          style: getNodeStyle(localProgress[node.id] === 'aprobado'),
          data: { ...node.data, status: localProgress[node.id] || 'pendiente' }
        }));

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

  // --- 4. CLICK EN NODO ---
  const onNodeClick = useCallback((event, node) => {
    const newStatus = node.data.status === 'aprobado' ? 'pendiente' : 'aprobado';
    updateLocalProgress(node.id, newStatus);

    setNodes((nds) => nds.map((n) => 
      n.id !== node.id ? n : {
        ...n,
        data: { ...n.data, status: newStatus },
        style: getNodeStyle(newStatus === 'aprobado')
      }
    ));
  }, [setNodes, updateLocalProgress]);

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

      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          minZoom={0.1}
        >
          <Background color="#aaa" gap={16} />
          <Controls />
          <MiniMap 
            style={{ border: '1px solid #777' }} 
            nodeColor={(n) => n.data.status === 'aprobado' ? '#28a745' : '#eee'} 
          />
          <Legend />
        </ReactFlow>
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