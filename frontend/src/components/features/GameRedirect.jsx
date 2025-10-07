import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * GameRedirect Component
 * Redirects old game URLs to the new game entry system
 */
const GameRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to game-entry for the new system
    navigate('/game-entry', { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vintage-red-600 mx-auto mb-4"></div>
        <p className="text-charcoal-600">Redirecting to game entry...</p>
      </div>
    </div>
  );
};

export default GameRedirect;