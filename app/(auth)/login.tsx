import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { GoogleSigninButton } from '@react-native-google-signin/google-signin';
import { configureGoogleSignIn, signInWithGoogle } from '../../config/googleAuth';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        configureGoogleSignIn();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in email and password');
            return;
        }

        setLoading(true);

        try {
            const { auth } = await import('../../config/firebase');
            const { signInWithEmailAndPassword } = await import('firebase/auth');

            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            if (!userCredential.user.emailVerified) {
                Alert.alert(
                    'Email Not Verified',
                    'Please verify your email before logging in. Check your inbox for the verification link.'
                );
                await auth.signOut();
                return;
            }

        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                Alert.alert('Error', 'No account found with this email.');
            } else if (error.code === 'auth/wrong-password') {
                Alert.alert('Error', 'Incorrect password.');
            } else if (error.code === 'auth/invalid-email') {
                Alert.alert('Error', 'Invalid email address.');
            } else if (error.code === 'auth/too-many-requests') {
                Alert.alert('Error', 'Too many failed attempts. Try again later.');
            } else {
                Alert.alert('Error', 'Login failed: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            const userCredential = await signInWithGoogle();
            if (userCredential) {
                console.log('Google sign in success');
            }
        } catch (error: any) {
            Alert.alert('Error', 'Google sign in failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address first.');
            return;
        }

        try {
            const { auth } = await import('../../config/firebase');
            const { sendPasswordResetEmail } = await import('firebase/auth');

            await sendPasswordResetEmail(auth, email);
            Alert.alert('Success', 'Password reset email sent. Check your inbox.');
        } catch (error) {
            Alert.alert('Error', 'Failed to send reset email.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome Back</Text>

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
                placeholder="Password"
                secureTextEntry
                onChangeText={setPassword}
                value={password}
                editable={!loading}
            />

            <Button
                title={loading ? 'Logging in...' : 'Login'}
                onPress={handleLogin}
                disabled={loading}
            />

            <View style={styles.forgotPassword}>
                <Button
                    title="Forgot Password?"
                    onPress={handleForgotPassword}
                    disabled={loading}
                />
            </View>

            <View style={styles.orContainer}>
                <View style={styles.line} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.line} />
            </View>

            <GoogleSigninButton
                size={GoogleSigninButton.Size.Wide}
                color={GoogleSigninButton.Color.Dark}
                onPress={handleGoogleSignIn}
                disabled={loading}
                style={styles.googleButton}
            />

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
    forgotPassword: {
        marginTop: 10,
    },
    orContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#ccc',
    },
    orText: {
        marginHorizontal: 10,
        color: '#666',
        fontSize: 16,
    },
    googleButton: {
        width: '100%',
        height: 48,
    },
    footer: {
        marginTop: 30,
    },
});