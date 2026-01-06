import { useState, useEffect, useCallback } from 'react';
import { authService, progressService } from '../api';

// Helpers para localStorage
const getLocalProgress = () => JSON.parse(localStorage.getItem('userProgress')) || {};
const setLocalProgress = (progress) => localStorage.setItem('userProgress', JSON.stringify(progress));

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar sesión al cargar
  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const userData = await authService.getMe();
          setUser(userData);
        } catch {
          authService.logout();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    await authService.login(email, password);
    const userData = await authService.getMe();
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (email, password) => {
    await authService.register(email, password);
    const userData = await authService.getMe();
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  return { user, loading, login, register, logout, isAuthenticated: !!user };
}

export function useProgress(setNodes) {
  
  // Cargar progreso desde la BD
  const loadCloudProgress = useCallback(async () => {
    try {
      const cloudProgress = await progressService.getProgress();
      if (cloudProgress.length === 0) return 0;

      const localProgress = getLocalProgress();
      cloudProgress.forEach(item => {
        localProgress[item.course_id] = item.status;
      });
      setLocalProgress(localProgress);

      // Actualizar nodos si se proporcionó setNodes
      if (setNodes) {
        setNodes((nds) => nds.map((n) => {
          const status = localProgress[n.id] || 'pendiente';
          const isApproved = status === 'aprobado';
          return {
            ...n,
            style: getNodeStyle(isApproved),
            data: { ...n.data, status }
          };
        }));
      }

      return cloudProgress.length;
    } catch (error) {
      console.error("Error cargando progreso:", error);
      return 0;
    }
  }, [setNodes]);

  // Sincronizar con la BD
  const syncWithCloud = useCallback(async () => {
    const progress = getLocalProgress();
    const progressList = Object.entries(progress).map(([course_id, status]) => ({
      course_id,
      status
    }));

    const res = await progressService.syncProgress(progressList);
    return res;
  }, []);

  // Actualizar progreso local de un curso
  const updateLocalProgress = useCallback((courseId, status) => {
    const progress = getLocalProgress();
    progress[courseId] = status;
    setLocalProgress(progress);
  }, []);

  return { loadCloudProgress, syncWithCloud, updateLocalProgress, getLocalProgress };
}

// Colores según estado del curso
const NODE_STYLES = {
  aprobado: {
    background: '#d4edda',
    border: '2px solid #28a745',
    color: '#155724'
  },
  disponible: {
    background: '#cce5ff',
    border: '2px solid #007bff',
    color: '#004085'
  },
  bloqueado: {
    background: '#e2e3e5',
    border: '2px solid #6c757d',
    color: '#383d41'
  },
  desaprobado: {
    background: '#f8d7da',
    border: '2px solid #dc3545',
    color: '#721c24'
  }
};

// Helper para estilos de nodos
export const getNodeStyle = (status) => {
  const styleConfig = NODE_STYLES[status] || NODE_STYLES.bloqueado;
  return {
    background: styleConfig.background,
    border: styleConfig.border,
    color: styleConfig.color,
    width: 180,
    padding: 10,
    borderRadius: 8,
    fontSize: '12px',
    fontFamily: 'Arial',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  };
};

/**
 * Algoritmo BFS para calcular estados de todos los nodos
 * Estados: aprobado, desaprobado, disponible, bloqueado
 * 
 * Reglas:
 * - aprobado: el usuario marcó el curso como aprobado
 * - desaprobado: el usuario marcó el curso como desaprobado  
 * - disponible: todos los prerrequisitos están aprobados
 * - bloqueado: al menos un prerrequisito no está aprobado
 */
export const calculateNodeStates = (nodes, localProgress) => {
  // Crear mapa de nodos para acceso rápido
  const nodeMap = new Map();
  nodes.forEach(node => nodeMap.set(node.id, node));
  
  // Calcular estado de cada nodo
  const newStates = {};
  
  nodes.forEach(node => {
    const savedStatus = localProgress[node.id];
    const prerequisites = node.data.prerequisites || [];
    
    // Si tiene un estado guardado (aprobado o desaprobado), usarlo
    if (savedStatus === 'aprobado' || savedStatus === 'desaprobado') {
      newStates[node.id] = savedStatus;
      return;
    }
    
    // Si no tiene prerrequisitos, está disponible
    if (prerequisites.length === 0) {
      newStates[node.id] = 'disponible';
      return;
    }
    
    // Verificar si todos los prerrequisitos están aprobados
    const allPrereqsApproved = prerequisites.every(prereq => {
      const prereqStatus = localProgress[prereq.id];
      return prereqStatus === 'aprobado';
    });
    
    newStates[node.id] = allPrereqsApproved ? 'disponible' : 'bloqueado';
  });
  
  return newStates;
};

/**
 * Algoritmo BFS para calcular el impacto de desaprobar un curso
 * 
 * @param {string} courseId - ID del curso a analizar
 * @param {Array} nodes - Lista de todos los nodos
 * @returns {Object} - { affectedCourses, affectedCycles, totalCredits }
 */
export const calculateImpact = (courseId, nodes) => {
  // Construir grafo de dependencias inversas (qué cursos dependen de cada curso)
  const dependentsMap = new Map();
  
  nodes.forEach(node => {
    const prereqs = node.data.prerequisites || [];
    prereqs.forEach(prereq => {
      if (!dependentsMap.has(prereq.id)) {
        dependentsMap.set(prereq.id, []);
      }
      dependentsMap.get(prereq.id).push({
        id: node.id,
        name: node.data.name,
        cycle: node.data.cycle,
        credits: node.data.credits
      });
    });
  });
  
  // BFS para encontrar todos los cursos afectados
  const visited = new Set();
  const queue = [courseId];
  const affectedCourses = [];
  
  while (queue.length > 0) {
    const currentId = queue.shift();
    
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    
    const dependents = dependentsMap.get(currentId) || [];
    
    dependents.forEach(dep => {
      if (!visited.has(dep.id)) {
        affectedCourses.push(dep);
        queue.push(dep.id);
      }
    });
  }
  
  // Calcular estadísticas
  const affectedCycles = [...new Set(affectedCourses.map(c => c.cycle))].sort((a, b) => a - b);
  const totalCredits = affectedCourses.reduce((sum, c) => sum + (c.credits || 0), 0);
  
  // Ordenar cursos por ciclo
  affectedCourses.sort((a, b) => a.cycle - b.cycle);
  
  return {
    affectedCourses,
    affectedCycles,
    totalCredits,
    count: affectedCourses.length
  };
};
