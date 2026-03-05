import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleLogin = async () => {
        // Clear previous errors
        setErrorMessage('');

        // Validation
        if (!email || !password) {
            setErrorMessage('Please fill in all fields');
            return;
        }

        if (!email.includes('@') || !email.includes('.')) {
            setErrorMessage('Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            const { auth } = await import('../../config/firebase');
            const { signInWithEmailAndPassword } = await import('firebase/auth');

            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            // Check if email is verified
            if (!userCredential.user.emailVerified) {
                setErrorMessage('Please verify your email before logging in');
                await auth.signOut();
                return;
            }

            // Success
            router.replace('/(tabs)');

        } catch (error: any) {
            console.error('Login error:', error);

            // Better error messages
            switch (error.code) {
                case 'auth/user-not-found':
                    setErrorMessage('No account found with this email');
                    break;
                case 'auth/wrong-password':
                    setErrorMessage('Incorrect password');
                    break;
                case 'auth/invalid-email':
                    setErrorMessage('Invalid email address');
                    break;
                case 'auth/too-many-requests':
                    setErrorMessage('Too many failed attempts. Try again later');
                    break;
                case 'auth/user-disabled':
                    setErrorMessage('This account has been disabled');
                    break;
                default:
                    setErrorMessage('Login failed. Please try again');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome Back</Text>

            {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            <TextInput
                style={[styles.input, errorMessage && !email ? styles.inputError : null]}
                placeholder="Email"
                onChangeText={setEmail}
                value={email}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
            />

            <TextInput
                style={[styles.input, errorMessage && !password ? styles.inputError : null]}
                placeholder="Password"
                secureTextEntry
                onChangeText={setPassword}
                value={password}
                editable={!loading}
            />

            <Button
                title={loading ? "Logging in..." : "Login"}
                onPress={handleLogin}
                disabled={loading}
            />

            <View style={styles.forgotPassword}>
                <Button
                    title="Forgot Password?"
                    onPress={() => Alert.alert("Info", "Password reset will be sent to your email")}
                    disabled={loading}
                />
            </View>

            <View style={styles.footer}>
                <Button
                    title="Don't have an account? Register"
                    onPress={() => router.push('/(auth)/register')}
                    disabled={loading}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#ccc',
        marginBottom: 15,
        padding: 10,
        borderRadius: 8,
        fontSize: 16,
    },
    inputError: {
        borderColor: '#ff4444',
    },
    errorText: {
        color: '#ff4444',
        marginBottom: 15,
        textAlign: 'center',
        fontSize: 14,
    },
    forgotPassword: {
        marginTop: 10,
    },
    footer: {
        marginTop: 30,
    },
});