import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        try {
            const { auth } = await import('../../config/firebase');
            const { signInWithEmailAndPassword } = await import('firebase/auth');

            await signInWithEmailAndPassword(auth, email, password);

        } catch (error: any) {
            Alert.alert("Chyba", "Nesprávný email nebo heslo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="Email"
                onChangeText={setEmail}
                value={email}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
            />
            <TextInput
                style={styles.input}
                placeholder="Heslo"
                secureTextEntry
                onChangeText={setPassword}
                value={password}
                editable={!loading}
            />
            <Button
                title={loading ? "Přihlašuji..." : "Přihlásit se"}
                onPress={handleLogin}
                disabled={loading}
            />
            <Button
                title="Nemám účet"
                onPress={() => router.push('/(auth)/register')}
                disabled={loading}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    input: {
        height: 40,
        borderWidth: 1,
        borderColor: '#ccc',
        marginBottom: 10,
        padding: 10,
        borderRadius: 5,
    },
});