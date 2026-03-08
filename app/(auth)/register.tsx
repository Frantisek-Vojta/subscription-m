import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';

export default function Register() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [verificationSent, setVerificationSent] = useState(false);


    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    const validatePassword = (pass: string) => {
        if (pass.length < 6) {
            return 'Password must be at least 6 characters';
        }
        if (!/[A-Z]/.test(pass)) {
            return 'Password must contain at least one uppercase letter';
        }
        if (!/[0-9]/.test(pass)) {
            return 'Password must contain at least one number';
        }
        return '';
    };

    const handlePasswordChange = (text: string) => {
        setPassword(text);
        setPasswordError(validatePassword(text));


        if (confirmPassword) {
            setConfirmPasswordError(text !== confirmPassword ? 'Passwords do not match' : '');
        }
    };

    const handleConfirmPasswordChange = (text: string) => {
        setConfirmPassword(text);
        setConfirmPasswordError(text !== password ? 'Passwords do not match' : '');
    };

    const handleRegister = async () => {
        setPasswordError('');
        setConfirmPasswordError('');

        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }


        const passError = validatePassword(password);
        if (passError) {
            setPasswordError(passError);
            return;
        }

        if (password !== confirmPassword) {
            setConfirmPasswordError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const { auth } = await import('../../config/firebase');
            const { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } = await import('firebase/auth');


            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            await updateProfile(userCredential.user, {
                displayName: `${firstName} ${lastName}`
            });

            await sendEmailVerification(userCredential.user);

            setVerificationSent(true);

        } catch (error: any) {
            console.error('Registration error:', error);

            if (error.code === 'auth/email-already-in-use') {
                Alert.alert('Error', 'This email is already registered.');
            } else if (error.code === 'auth/invalid-email') {
                Alert.alert('Error', 'Invalid email address.');
            } else if (error.code === 'auth/weak-password') {
                Alert.alert('Error', 'Password is too weak.');
            } else {
                Alert.alert('Error', 'Registration failed: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const resendVerification = async () => {
        setLoading(true);
        try {
            const { auth } = await import('../../config/firebase');
            const { sendEmailVerification } = await import('firebase/auth');

            if (auth.currentUser) {
                await sendEmailVerification(auth.currentUser);
                Alert.alert('Success', 'Verification email has been resent. Please check your inbox.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to resend verification email.');
        } finally {
            setLoading(false);
        }
    };

    const checkVerification = async () => {
        setLoading(true);
        try {
            const { auth } = await import('../../config/firebase');

            if (auth.currentUser) {
                await auth.currentUser.reload();

                if (auth.currentUser.emailVerified) {
                    Alert.alert(
                        'Success',
                        'Email verified successfully! You can now log in.',
                        [
                            { text: 'Go to Login', onPress: () => router.push('/(auth)/login') }
                        ]
                    );
                } else {
                    Alert.alert(
                        'Not Verified',
                        'Email not verified yet. Please check your inbox and click the verification link.'
                    );
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to check verification status.');
        } finally {
            setLoading(false);
        }
    };

    if (verificationSent) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Verify Your Email</Text>

                <Text style={styles.message}>
                    We've sent a verification link to:{'\n'}
                    <Text style={styles.email}>{email}</Text>
                </Text>

                <Text style={styles.message}>
                    Please check your email and click the link to verify your account.
                    {'\n\n'}
                    After verification, click the button below to continue.
                </Text>

                <Button
                    title={loading ? 'Checking...' : "I've Verified My Email"}
                    onPress={checkVerification}
                    disabled={loading}
                />

                <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>Didn't receive the email? </Text>
                    <Button
                        title="Resend"
                        onPress={resendVerification}
                        disabled={loading}
                    />
                </View>

                <View style={styles.footer}>
                    <Button
                        title="Back to Login"
                        onPress={() => router.push('/(auth)/login')}
                        disabled={loading}
                    />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create Account</Text>

            <TextInput
                style={styles.input}
                placeholder="First Name"
                onChangeText={setFirstName}
                value={firstName}
                editable={!loading}
            />

            <TextInput
                style={styles.input}
                placeholder="Last Name"
                onChangeText={setLastName}
                value={lastName}
                editable={!loading}
            />

            <TextInput
                style={styles.input}
                placeholder="Email"
                onChangeText={setEmail}
                value={email}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
            />

            <View>
                <TextInput
                    style={[styles.input, passwordError ? styles.inputError : null]}
                    placeholder="Password"
                    secureTextEntry
                    onChangeText={handlePasswordChange}
                    value={password}
                    editable={!loading}
                />
                {passwordError ? (
                    <Text style={styles.errorText}>{passwordError}</Text>
                ) : null}
            </View>

            <View>
                <TextInput
                    style={[styles.input, confirmPasswordError ? styles.inputError : null]}
                    placeholder="Confirm Password"
                    secureTextEntry
                    onChangeText={handleConfirmPasswordChange}
                    value={confirmPassword}
                    editable={!loading}
                />
                {confirmPasswordError ? (
                    <Text style={styles.errorText}>{confirmPasswordError}</Text>
                ) : null}
            </View>

            <Button
                title={loading ? 'Creating account...' : 'Register'}
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
        marginBottom: 5,
        padding: 10,
        borderRadius: 8,
        fontSize: 16,
    },
    inputError: {
        borderColor: '#ff4444',
    },
    errorText: {
        color: '#ff4444',
        fontSize: 12,
        marginBottom: 10,
        marginLeft: 5,
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