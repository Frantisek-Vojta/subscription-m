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
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import {router} from 'expo-router';
import {createUserWithEmailAndPassword, sendEmailVerification, updateProfile} from 'firebase/auth';
import {auth} from '../../config/firebase';

export default function Register() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [verificationSent, setVerificationSent] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [emailError, setEmailError] = useState('');

    const validatePassword = (pass: string) => {
        if (pass.length < 6) return 'At least 6 characters';
        if (!/[A-Z]/.test(pass)) return 'At least one uppercase letter';
        if (!/[0-9]/.test(pass)) return 'At least one number';
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
        setEmailError('');
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
        if (!auth) {
            Alert.alert('Error', 'Auth not available');
            return;
        }
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, {displayName: `${firstName} ${lastName}`});
            await sendEmailVerification(userCredential.user);
            setVerificationSent(true);
        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                setEmailError('This email is already registered.');
            } else if (error.code === 'auth/invalid-email') {
                setEmailError('Invalid email address.');
            } else if (error.code === 'auth/weak-password') {
                setPasswordError('Password is too weak.');
            } else {
                Alert.alert('Error', 'Registration failed: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const resendVerification = async () => {
        if (!auth?.currentUser) return;
        setLoading(true);
        try {
            await sendEmailVerification(auth.currentUser);
            Alert.alert('Success', 'Verification email resent. Check your inbox.');
        } catch (error) {
            Alert.alert('Error', 'Failed to resend verification email.');
        } finally {
            setLoading(false);
        }
    };

    const checkVerification = async () => {
        if (!auth?.currentUser) return;
        setLoading(true);
        try {
            await auth.currentUser.reload();
            if (auth.currentUser.emailVerified) {
                Alert.alert('Success', 'Email verified! You can now log in.', [
                    {text: 'Go to Login', onPress: () => router.push('/(auth)/login')}
                ]);
            } else {
                Alert.alert('Not Verified', 'Email not verified yet. Please check your inbox.');
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
                <View style={styles.verifyInner}>
                    <View style={styles.verifyIcon}>
                        <Text style={styles.verifyIconText}>✉</Text>
                    </View>
                    <Text style={styles.verifyTitle}>Check your inbox</Text>
                    <Text style={styles.verifySubtitle}>We sent a verification link to</Text>
                    <Text style={styles.verifyEmail}>{email}</Text>
                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                        onPress={checkVerification}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? <ActivityIndicator color="#fff"/> :
                            <Text style={styles.loginButtonText}>I've verified my email</Text>}
                    </TouchableOpacity>
                    <View style={styles.resendRow}>
                        <Text style={styles.registerText}>Didn't receive it? </Text>
                        <TouchableOpacity onPress={resendVerification} disabled={loading}>
                            <Text style={styles.registerLink}>Resend</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.backButton}
                                      disabled={loading}>
                        <Text style={styles.backText}>← Back to login</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Create account</Text>
                    <Text style={styles.subtitle}>It's free and always will be</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.nameRow}>
                        <View
                            style={[styles.inputWrapper, styles.nameInput, focusedField === 'firstName' && styles.inputWrapperFocused]}>
                            <Text style={styles.inputLabel}>First name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Jan"
                                placeholderTextColor="#aaa"
                                onChangeText={setFirstName}
                                value={firstName}
                                editable={!loading}
                                onFocus={() => setFocusedField('firstName')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>
                        <View
                            style={[styles.inputWrapper, styles.nameInput, focusedField === 'lastName' && styles.inputWrapperFocused]}>
                            <Text style={styles.inputLabel}>Last name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Novák"
                                placeholderTextColor="#aaa"
                                onChangeText={setLastName}
                                value={lastName}
                                editable={!loading}
                                onFocus={() => setFocusedField('lastName')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>
                    </View>

                    <View
                        style={[styles.inputWrapper, focusedField === 'email' && styles.inputWrapperFocused, !!emailError && styles.inputWrapperError]}>
                        <Text style={styles.inputLabel}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="you@example.com"
                            placeholderTextColor="#aaa"
                            onChangeText={(text) => {
                                setEmail(text);
                                setEmailError('');
                            }}
                            value={email}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!loading}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                        />
                    </View>
                    {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                    <View
                        style={[styles.inputWrapper, focusedField === 'password' && styles.inputWrapperFocused, !!passwordError && styles.inputWrapperError]}>
                        <Text style={styles.inputLabel}>Password</Text>
                        <View style={styles.passwordRow}>
                            <TextInput
                                style={[styles.input, {flex: 1}]}
                                placeholder="••••••••"
                                placeholderTextColor="#aaa"
                                secureTextEntry={!showPassword}
                                onChangeText={handlePasswordChange}
                                value={password}
                                editable={!loading}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}
                                              disabled={loading}>
                                <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

                    <View
                        style={[styles.inputWrapper, focusedField === 'confirmPassword' && styles.inputWrapperFocused, !!confirmPasswordError && styles.inputWrapperError]}>
                        <Text style={styles.inputLabel}>Confirm password</Text>
                        <View style={styles.passwordRow}>
                            <TextInput
                                style={[styles.input, {flex: 1}]}
                                placeholder="••••••••"
                                placeholderTextColor="#aaa"
                                secureTextEntry={!showConfirmPassword}
                                onChangeText={handleConfirmPasswordChange}
                                value={confirmPassword}
                                editable={!loading}
                                onFocus={() => setFocusedField('confirmPassword')}
                                onBlur={() => setFocusedField(null)}
                            />
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                              style={styles.eyeButton} disabled={loading}>
                                <Text style={styles.eyeText}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}

                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                        onPress={handleRegister}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? <ActivityIndicator color="#fff"/> :
                            <Text style={styles.loginButtonText}>Create account</Text>}
                    </TouchableOpacity>
                </View>

                <View style={styles.divider}>
                    <View style={styles.dividerLine}/>
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine}/>
                </View>

                <View style={styles.resendRow}>
                    <Text style={styles.registerText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => router.push('/(auth)/login')} disabled={loading}>
                        <Text style={styles.registerLink}>Log in</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#f9f9f7'},
    scrollContent: {flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 48},
    header: {marginBottom: 32},
    title: {fontSize: 32, fontWeight: '700', color: '#111', letterSpacing: -0.5, marginBottom: 6},
    subtitle: {fontSize: 16, color: '#888'},
    form: {},
    nameRow: {flexDirection: 'row', marginBottom: 12},
    nameInput: {flex: 1, marginBottom: 0},
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
    inputWrapperError: {borderColor: '#ff4444'},
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
    errorText: {color: '#ff4444', fontSize: 12, marginTop: -8, marginBottom: 8, marginLeft: 4},
    loginButton: {backgroundColor: '#111', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4},
    loginButtonDisabled: {backgroundColor: '#555'},
    loginButtonText: {color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: 0.2},
    divider: {flexDirection: 'row', alignItems: 'center', marginVertical: 28},
    dividerLine: {flex: 1, height: 1, backgroundColor: '#e8e8e8'},
    dividerText: {fontSize: 13, color: '#bbb', fontWeight: '500', marginHorizontal: 12},
    resendRow: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center'},
    registerText: {fontSize: 14, color: '#888'},
    registerLink: {fontSize: 14, color: '#111', fontWeight: '600'},
    verifyInner: {flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28},
    verifyIcon: {
        width: 72,
        height: 72,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#e8e8e8',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16
    },
    verifyIconText: {fontSize: 32},
    verifyTitle: {fontSize: 26, fontWeight: '700', color: '#111', letterSpacing: -0.3, marginBottom: 8},
    verifySubtitle: {fontSize: 15, color: '#888', textAlign: 'center', marginBottom: 4},
    verifyEmail: {fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 24},
    backButton: {marginTop: 16},
    backText: {fontSize: 14, color: '#888'},

});