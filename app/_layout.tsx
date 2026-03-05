import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { router, useSegments } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

export default function RootLayout() {
    const { user, loading } = useAuth();
    const segments = useSegments();

    useEffect(() => {
        if (loading) return;

        const inAuthGroup = segments[0] === '(auth)';

        console.log('Auth state changed:', { user: user?.email, inAuthGroup }); // DEBUG

        if (!user && !inAuthGroup) {
            console.log('Redirecting to login...'); // DEBUG
            router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
            console.log('Redirecting to tabs...'); // DEBUG
            router.replace('/(tabs)');
        }
    }, [user, loading, segments]);

    if (loading) {
        return null;
    }

    return (
        <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
    );
}