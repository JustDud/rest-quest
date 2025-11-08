import React, { createContext, useCallback, useMemo, useState } from 'react';
import { experiences } from '../data/experiences';

export const ExperiencesContext = createContext(null);

export function ExperiencesProvider({ children }) {
  const [deck, setDeck] = useState(experiences);
  const [liked, setLiked] = useState([]);
  const [priority, setPriority] = useState([]);
  const [history, setHistory] = useState([]);

  const likeExperience = useCallback((experience, { priorityLike = false } = {}) => {
    setLiked((prev) => {
      if (prev.find((item) => item.id === experience.id)) return prev;
      return [...prev, experience];
    });

    if (priorityLike) {
      setPriority((prev) => {
        if (prev.find((item) => item.id === experience.id)) return prev;
        return [...prev, experience];
      });
    }

    setHistory((prev) => [...prev, { experience, action: priorityLike ? 'superlike' : 'like' }]);
  }, []);

  const superLikeExperience = useCallback(
    (experience) => likeExperience(experience, { priorityLike: true }),
    [likeExperience]
  );

  const passExperience = useCallback((experience) => {
    setHistory((prev) => [...prev, { experience, action: 'pass' }]);
  }, []);

  const undoLast = useCallback(() => {
    setHistory((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      if (last.action === 'like' || last.action === 'superlike') {
        setLiked((likedPrev) => likedPrev.filter((item) => item.id !== last.experience.id));
        if (last.action === 'superlike') {
          setPriority((priorityPrev) =>
            priorityPrev.filter((item) => item.id !== last.experience.id)
          );
        }
      }
      return prev.slice(0, -1);
    });
  }, []);

  const value = useMemo(
    () => ({
      deck,
      liked,
      priority,
      likeExperience,
      superLikeExperience,
      passExperience,
      undoLast,
      setDeck,
    }),
    [deck, liked, priority, likeExperience, superLikeExperience, passExperience, undoLast]
  );

  return <ExperiencesContext.Provider value={value}>{children}</ExperiencesContext.Provider>;
}
