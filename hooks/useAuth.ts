import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        const initAuth = async () => {
            try {
                const { auth } = await import('../config/firebase');
                const { onAuthStateChanged } = await import('firebase/auth');

                unsubscribe = onAuthStateChanged(auth, (currentUser) => {
                    setUser(currentUser);
                    setLoading(false);
                });
            } catch (error) {
                console.error('Auth initialization error:', error);
                setLoading(false);
            }
        };

        initAuth();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    return { user, loading };
}