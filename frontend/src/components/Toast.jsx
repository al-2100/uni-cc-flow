import { useState, useEffect } from 'react';
import './Toast.css';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!message) return null;

  const className = `toast toast--${type} ${visible ? 'toast--visible' : 'toast--hidden'}`;

  return (
    <div className={className}>
      {message}
    </div>
  );
}
