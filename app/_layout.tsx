import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { router, useSegments } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { ThemeProvider } from '../context/ThemeContext';

export default function RootLayout() {
    const { user, loading } = useAuth();
    const segments = useSegments();

    useEffect(() => {
        if (loading) return;
        const inAuthGroup = segments[0] === '(auth)';
        if (!user && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [user, loading, segments]);

    if (loading) return null;

    return (
        <ThemeProvider>
            <Stack>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            </Stack>
        </ThemeProvider>
    );
}