import React, {useState} from 'react';
import {
    View,
    TextInput,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import {router} from 'expo-router';
import {signInWithEmailAndPassword, sendPasswordResetEmail} from 'firebase/auth';
import {auth} from '../../config/firebase';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in email and password');
            return;
        }
        if (!auth) {
            Alert.alert('Error', 'Auth not available');
            return;
        }
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            if (!userCredential.user.emailVerified) {
                Alert.alert('Email Not Verified', 'Please verify your email before logging in.');
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

    const handleForgotPassword = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address first.');
            return;
        }
        if (!auth) return;
        try {
            await sendPasswordResetEmail(auth, email);
            Alert.alert('Success', 'Password reset email sent. Check your inbox.');
        } catch (error) {
            Alert.alert('Error', 'Failed to send reset email.');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.inner}>
                <View style={styles.header}>
                    <Text style={styles.title}>Welcome back</Text>
                    <Text style={styles.subtitle}>Sign in to your account</Text>
                </View>

                <View style={styles.form}>
                    <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
                        <Text style={styles.inputLabel}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="you@example.com"
                            placeholderTextColor="#aaa"
                            onChangeText={setEmail}
                            value={email}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!loading}
                            onFocus={() => setEmailFocused(true)}
                            onBlur={() => setEmailFocused(false)}
                        />
                    </View>

                    <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
                        <Text style={styles.inputLabel}>Password</Text>
                        <View style={styles.passwordRow}>
                            <TextInput
                                style={[styles.input, {flex: 1}]}
                                placeholder="••••••••"
                                placeholderTextColor="#aaa"
                                secureTextEntry={!showPassword}
                                onChangeText={setPassword}
                                value={password}
                                editable={!loading}
                                onFocus={() => setPasswordFocused(true)}
                                onBlur={() => setPasswordFocused(false)}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeButton}
                                disabled={loading}
                            >
                                <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handleForgotPassword}
                        disabled={loading}
                        style={styles.forgotWrapper}
                    >
                        <Text style={styles.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff"/>
                        ) : (
                            <Text style={styles.loginButtonText}>Log in</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.divider}>
                    <View style={styles.dividerLine}/>
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine}/>
                </View>

                <View style={styles.registerRow}>
                    <Text style={styles.registerText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => router.push('/(auth)/register')} disabled={loading}>
                        <Text style={styles.registerLink}>Register now for free</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#f9f9f7'},
    inner: {flex: 1, justifyContent: 'center', paddingHorizontal: 28},
    header: {marginBottom: 36},
    title: {fontSize: 32, fontWeight: '700', color: '#111', letterSpacing: -0.5, marginBottom: 6},
    subtitle: {fontSize: 16, color: '#888'},
    form: {},
    inputWrapper: {
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#e8e8e8',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 12
    },
    inputWrapperFocused: {borderColor: '#111'},
    inputLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#999',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: 4
    },
    input: {fontSize: 16, color: '#111', padding: 0},
    passwordRow: {flexDirection: 'row', alignItems: 'center'},
    eyeButton: {paddingLeft: 10},
    eyeText: {fontSize: 13, color: '#888', fontWeight: '500'},
    forgotWrapper: {alignSelf: 'flex-end', marginBottom: 16},
    forgotText: {fontSize: 13, color: '#888'},
    loginButton: {backgroundColor: '#111', borderRadius: 14, paddingVertical: 16, alignItems: 'center'},
    loginButtonDisabled: {backgroundColor: '#555'},
    loginButtonText: {color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: 0.2},
    divider: {flexDirection: 'row', alignItems: 'center', marginVertical: 28},
    dividerLine: {flex: 1, height: 1, backgroundColor: '#e8e8e8'},
    dividerText: {fontSize: 13, color: '#bbb', fontWeight: '500', marginHorizontal: 12},
    registerRow: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center'},
    registerText: {fontSize: 14, color: '#888'},
    registerLink: {fontSize: 14, color: '#111', fontWeight: '600'},

});