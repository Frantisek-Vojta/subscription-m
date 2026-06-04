import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabsLayout() {
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const check = () => AsyncStorage.getItem('darkMode').then(val => setDarkMode(val === 'true'));
        check();
        const interval = setInterval(check, 300);
        return () => clearInterval(interval);
    }, []);

    const bg = darkMode ? '#111' : '#fff';
    const border = darkMode ? '#222' : '#e8e8e8';
    const active = darkMode ? '#fff' : '#111';
    const inactive = darkMode ? '#555' : '#aaa';

    return (
        <Tabs screenOptions={{
            headerShown: false,
            tabBarStyle: { backgroundColor: bg, borderTopColor: border, borderTopWidth: 1 },
            tabBarActiveTintColor: active,
            tabBarInactiveTintColor: inactive,
        }}>
            <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
            <Tabs.Screen name="graph" options={{ title: 'Graph', tabBarIcon: ({ color, size }) => <Ionicons name="pie-chart" size={size} color={color} /> }} />
            <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />
        </Tabs>
    );
}