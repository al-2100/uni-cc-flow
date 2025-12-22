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

// Helper para estilos de nodos
export const getNodeStyle = (isApproved) => ({
  background: isApproved ? '#d4edda' : '#fff',
  border: isApproved ? '2px solid #28a745' : '1px solid #777',
  width: 180,
  padding: 10,
  borderRadius: 8,
  fontSize: '12px',
  fontFamily: 'Arial',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
});
