// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="login"
                options={{
                    title: 'Přihlášení',
                    headerShown: true
                }}
            />
            <Stack.Screen
                name="register"
                options={{
                    title: 'Registrace',
                    headerShown: true
                }}
            />
        </Stack>
    );
}