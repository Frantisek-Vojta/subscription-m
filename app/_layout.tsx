import {Stack} from 'expo-router';
import {useEffect} from 'react';
import {router, useSegments} from 'expo-router';
import {useAuth} from '../hooks/useAuth';
import {ThemeProvider} from '../context/ThemeContext';
import * as Notifications from 'expo-notifications';
import {db} from '../config/firebase';
import {doc, setDoc} from 'firebase/firestore';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

Notifications.setNotificationChannelAsync('default', {
    name: 'Subscription reminders',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#6366f1',
    sound: 'default',
});
async function registerForPushNotifications(uid: string) {
    try {
        const {status: existingStatus} = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const {status} = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') return;

        const token = await Notifications.getExpoPushTokenAsync({
            projectId: 'b73a943d-dfc3-4dcd-b460-1a872bcddbb4',
        });

        if (db && token.data) {
            await setDoc(doc(db, 'users', uid), {
                expoPushToken: token.data,
            }, {merge: true});
        }
    } catch (error) {
        console.log('Push notification error:', error);
    }
}

export default function RootLayout() {
    const {user, loading} = useAuth();
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

    useEffect(() => {
        if (user) {
            registerForPushNotifications(user.uid);
        }
    }, [user]);

    if (loading) return null;

    return (
        <ThemeProvider>
            <Stack>
                <Stack.Screen name="(auth)" options={{headerShown: false}}/>
                <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
                <Stack.Screen name="modal" options={{presentation: 'modal'}}/>
            </Stack>
        </ThemeProvider>
    );
}