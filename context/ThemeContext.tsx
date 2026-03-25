import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeContextType = {
    darkMode: boolean;
    toggleDarkMode: (value: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType>({ darkMode: false, toggleDarkMode: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemScheme = useColorScheme();
    const [darkMode, setDarkMode] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem('darkMode').then(val => {
            if (val !== null) setDarkMode(val === 'true');
            else setDarkMode(systemScheme === 'dark');
            setLoaded(true);
        });
    }, []);

    const toggleDarkMode = async (value: boolean) => {
        setDarkMode(value);
        await AsyncStorage.setItem('darkMode', String(value));
    };

    if (!loaded) return null;

    return (
        <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);