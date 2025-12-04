import { useEffect, useState, useRef } from 'react';

export default function useUserId() {
  const [userId, setUserId] = useState<string | null>(null);
  const isCreatingUser = useRef(false);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');

    if (storedUserId) {
      setUserId(storedUserId);
      return;
    }

    if (isCreatingUser.current) return;
    isCreatingUser.current = true;

    const createAndStoreUser = async () => {
      try {
        const response = await fetch('http://localhost:3005/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          console.error('Failed to create user:', response.statusText);
          isCreatingUser.current = false; // Reset on failure so we can try again if component remounts or logic allows
          return;
        }

        const data = await response.json();
        const newUserId = data.user?.id;

        if (newUserId) {
          localStorage.setItem('userId', newUserId);
          setUserId(newUserId);
        }
      } catch (error) {
        console.error('Error creating user:', error);
        isCreatingUser.current = false;
      }
    };

    createAndStoreUser();
  }, []);

  return userId;
}
