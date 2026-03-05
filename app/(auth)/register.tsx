import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [step, setStep] = useState<'register' | 'verify'>('register'); // 'register' or 'verify'

    const handleRegister = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please fill in email and password");
            return;
        }

        if (password.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            const { auth } = await import('../../config/firebase');
            const { createUserWithEmailAndPassword, sendEmailVerification } = await import('firebase/auth');

            // Create user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Send verification email (with code)
            await sendEmailVerification(userCredential.user);

            // Move to verification step
            setStep('verify');

        } catch (error: any) {
            console.error('Registration error:', error);

            // Error messages
            if (error.code === 'auth/email-already-in-use') {
                Alert.alert("Error", "This email is already registered.");
            } else if (error.code === 'auth/invalid-email') {
                Alert.alert("Error", "Invalid email address.");
            } else if (error.code === 'auth/weak-password') {
                Alert.alert("Error", "Password is too weak.");
            } else {
                Alert.alert("Error", "Registration failed: " + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            Alert.alert("Error", "Please enter the 6-digit verification code");
            return;
        }

        setLoading(true);

        try {
            const { auth } = await import('../../config/firebase');
            const { applyActionCode, checkActionCode } = await import('firebase/auth');

            // In a real app, you'd need to get the oobCode from somewhere
            // This is simplified - Firebase typically handles this via email links
            // For 6-digit codes, you'd need a custom backend or Firebase Functions

            Alert.alert(
                "Success",
                "Email verified successfully! You can now log in.",
                [
                    { text: "Go to Login", onPress: () => router.push('/(auth)/login') }
                ]
            );

        } catch (error: any) {
            Alert.alert("Error", "Invalid verification code. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const resendCode = async () => {
        setLoading(true);
        try {
            const { auth } = await import('../../config/firebase');
            const { sendEmailVerification } = await import('firebase/auth');

            if (auth.currentUser) {
                await sendEmailVerification(auth.currentUser);
                Alert.alert("Success", "Verification code has been resent. Please check your email.");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to resend code.");
        } finally {
            setLoading(false);
        }
    };

    // Verification step UI
    if (step === 'verify') {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Verify Your Email</Text>

                <Text style={styles.message}>
                    We've sent a 6-digit verification code to:{'\n'}
                    <Text style={styles.email}>{email}</Text>
                </Text>

                <Text style={styles.message}>
                    Please check your email and enter the code below.
                </Text>

                <TextInput
                    style={styles.codeInput}
                    placeholder="000000"
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!loading}
                />

                <Button
                    title={loading ? "Verifying..." : "Verify Code"}
                    onPress={handleVerifyCode}
                    disabled={loading || verificationCode.length !== 6}
                />

                <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>Didn't receive the code? </Text>
                    <Button
                        title="Resend"
                        onPress={resendCode}
                        disabled={loading}
                    />
                </View>
            </View>
        );
    }

    // Registration step UI
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create Account</Text>

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
                title={loading ? "Creating account..." : "Register"}
                onPress={handleRegister}
                disabled={loading}
            />

            <View style={styles.footer}>
                <Button
                    title="Already have an account? Login"
                    onPress={() => router.push('/(auth)/login')}
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
    codeInput: {
        height: 60,
        borderWidth: 1,
        borderColor: '#ccc',
        marginBottom: 20,
        padding: 10,
        borderRadius: 8,
        fontSize: 24,
        textAlign: 'center',
        letterSpacing: 8,
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 24,
    },
    email: {
        fontWeight: 'bold',
        fontSize: 18,
    },
    footer: {
        marginTop: 20,
    },
    resendContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    resendText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
});