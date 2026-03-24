import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Alert,
    ScrollView,
    TouchableOpacity,
    Image,
    useColorScheme
} from 'react-native';
import {router} from 'expo-router';
import {FontAwesome} from '@expo/vector-icons';
import {User, updateProfile, sendPasswordResetEmail, signOut} from 'firebase/auth';
import {auth} from '../../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Profile() {
    const systemScheme = useColorScheme();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState('');
    const [editingUsername, setEditingUsername] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const currentUser = auth?.currentUser ?? null;
        setUser(currentUser);
        const initialUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
        setUsername(initialUsername);
        setNewUsername(initialUsername);
        loadTheme();
        setLoading(false);
    }, []);

    const loadTheme = async () => {
        try {
            const saved = await AsyncStorage.getItem('darkMode');
            if (saved !== null) setDarkMode(saved === 'true');
            else setDarkMode(systemScheme === 'dark');
        } catch {
        }
    };

    const toggleDarkMode = async (value: boolean) => {
        setDarkMode(value);
        try {
            await AsyncStorage.setItem('darkMode', String(value));
        } catch {
        }
    };

    const handleUpdateUsername = async () => {
        try {
            if (auth?.currentUser) {
                await updateProfile(auth.currentUser, {displayName: newUsername});
                setUsername(newUsername);
                setEditingUsername(false);
                Alert.alert('Success', 'Username updated');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update username');
        }
    };

    const handleChangePassword = async () => {
        try {
            setLoading(true);
            setPasswordMessage('');
            if (user?.email && auth) {
                await sendPasswordResetEmail(auth, user.email);
                setPasswordMessage('Password reset link sent to your email');
            } else {
                Alert.alert('Error', 'No email address found');
            }
        } catch (error: any) {
            setPasswordMessage('Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            setLoading(true);
            if (auth) await signOut(auth);
            router.replace('/(auth)/login');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to logout');
            setLoading(false);
        }
    };

    const d = darkMode;
    const c = {
        bg: d ? '#111' : '#fff',
        headerBg: d ? '#1a1a1a' : '#f8f9fa',
        sectionBorder: d ? '#2a2a2a' : '#eee',
        text: d ? '#fff' : '#111',
        subtext: d ? '#888' : '#666',
        sectionTitle: d ? '#fff' : '#333',
        value: d ? '#ccc' : '#333',
        icon: d ? '#888' : '#666',
        toggleBg: d ? '#2a2a2a' : '#f0f0f0',
        toggleBorder: d ? '#333' : '#e0e0e0',
        successBg: d ? '#1a3a1a' : '#d4edda',
        successText: d ? '#4ade80' : '#155724',
        errorBg: d ? '#3a1a1a' : '#f8d7da',
        errorText: d ? '#f87171' : '#721c24',
    };

    if (loading) {
        return (
            <View style={[styles.container, {backgroundColor: c.bg}]}>
                <Text style={{color: c.text}}>Loading...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, {backgroundColor: c.bg}]}>
            <View style={[styles.header, {backgroundColor: c.headerBg}]}>
                <View style={styles.avatarContainer}>
                    {user?.photoURL ? (
                        <Image source={{uri: user.photoURL}} style={styles.avatar}/>
                    ) : (
                        <FontAwesome name="user-circle" size={100} color={c.subtext}/>
                    )}
                </View>

                {editingUsername ? (
                    <View style={styles.usernameEditContainer}>
                        <TextInput
                            style={[styles.usernameInput, {
                                borderColor: c.sectionBorder,
                                color: c.text,
                                backgroundColor: c.bg
                            }]}
                            value={newUsername}
                            onChangeText={setNewUsername}
                            autoFocus
                        />
                        <View style={styles.usernameEditButtons}>
                            <TouchableOpacity onPress={() => setEditingUsername(false)}>
                                <FontAwesome name="times" size={24} color="#ff4444"/>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleUpdateUsername}>
                                <FontAwesome name="check" size={24} color="#00C851"/>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.usernameContainer}>
                        <Text style={[styles.username, {color: c.text}]}>{username}</Text>
                        <TouchableOpacity onPress={() => setEditingUsername(true)}>
                            <FontAwesome name="pencil" size={20} color="#2196F3"/>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <View style={[styles.section, {borderBottomColor: c.sectionBorder}]}>
                <Text style={[styles.sectionTitle, {color: c.sectionTitle}]}>Account Information</Text>

                <View style={styles.infoRow}>
                    <FontAwesome name="envelope" size={20} color={c.icon} style={styles.icon}/>
                    <Text style={[styles.label, {color: c.subtext}]}>Email</Text>
                    <Text style={[styles.value, {color: c.value}]}>{user?.email}</Text>
                </View>

                <View style={styles.infoRow}>
                    <FontAwesome name="lock" size={20} color={c.icon} style={styles.icon}/>
                    <Text style={[styles.label, {color: c.subtext}]}>Password</Text>
                    <Text style={[styles.value, {color: c.value}]}>••••••••</Text>
                </View>

                <View style={styles.infoRow}>
                    <FontAwesome name="check-circle" size={20} color={c.icon} style={styles.icon}/>
                    <Text style={[styles.label, {color: c.subtext}]}>Verified</Text>
                    <Text style={[styles.value, user?.emailVerified ? styles.verified : styles.notVerified]}>
                        {user?.emailVerified ? 'Yes' : 'No'}
                    </Text>
                </View>
            </View>

            <View style={[styles.section, {borderBottomColor: c.sectionBorder}]}>
                <Text style={[styles.sectionTitle, {color: c.sectionTitle}]}>Security</Text>

                <TouchableOpacity style={[styles.actionButton, {borderBottomColor: c.sectionBorder}]}
                                  onPress={handleChangePassword}>
                    <FontAwesome name="key" size={20} color={c.icon} style={styles.icon}/>
                    <Text style={[styles.actionButtonText, {color: c.text}]}>Change Password</Text>
                    <FontAwesome name="chevron-right" size={20} color={c.icon}/>
                </TouchableOpacity>

                {passwordMessage ? (
                    <Text style={[styles.message, passwordMessage.includes('sent')
                        ? {backgroundColor: c.successBg, color: c.successText}
                        : {backgroundColor: c.errorBg, color: c.errorText}
                    ]}>
                        {passwordMessage}
                    </Text>
                ) : null}
            </View>

            <View style={[styles.section, {borderBottomColor: c.sectionBorder}]}>
                <Text style={[styles.sectionTitle, {color: c.sectionTitle}]}>Appearance</Text>

                <View style={[styles.actionButton, {borderBottomWidth: 0}]}>
                    <FontAwesome name="moon-o" size={20} color={c.icon} style={styles.icon}/>
                    <Text style={[styles.actionButtonText, {color: c.text}]}>Dark mode</Text>
                    <TouchableOpacity
                        onPress={() => toggleDarkMode(!darkMode)}
                        style={[styles.toggle, {
                            backgroundColor: darkMode ? '#111' : '#e8e8e8',
                            borderColor: darkMode ? '#444' : '#ddd'
                        }]}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.toggleThumb, {
                            backgroundColor: darkMode ? '#fff' : '#fff',
                            transform: [{translateX: darkMode ? 20 : 2}],
                            shadowColor: '#000',
                            shadowOpacity: 0.15,
                            shadowRadius: 2,
                            elevation: 2,
                        }]}/>
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <FontAwesome name="sign-out" size={20} color="#ff4444"/>
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1},
    header: {alignItems: 'center', padding: 30},
    avatarContainer: {marginBottom: 15},
    avatar: {width: 100, height: 100, borderRadius: 50},
    usernameContainer: {flexDirection: 'row', alignItems: 'center'},
    username: {fontSize: 24, fontWeight: 'bold', marginRight: 10},
    usernameEditContainer: {alignItems: 'center'},
    usernameInput: {
        fontSize: 20,
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        width: 200,
        textAlign: 'center',
        marginBottom: 10
    },
    usernameEditButtons: {flexDirection: 'row', justifyContent: 'center', gap: 20},
    section: {padding: 20, borderBottomWidth: 1},
    sectionTitle: {fontSize: 18, fontWeight: 'bold', marginBottom: 15},
    infoRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingVertical: 5},
    icon: {width: 30},
    label: {fontSize: 16, width: 80},
    value: {fontSize: 16, flex: 1},
    verified: {color: '#00C851'},
    notVerified: {color: '#ff4444'},
    actionButton: {flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1},
    actionButtonText: {fontSize: 16, flex: 1, marginLeft: 15},
    message: {fontSize: 14, textAlign: 'center', padding: 10, marginTop: 10, borderRadius: 5},
    successMessage: {backgroundColor: '#d4edda', color: '#155724'},
    errorMessage: {backgroundColor: '#f8d7da', color: '#721c24'},
    toggle: {width: 44, height: 26, borderRadius: 13, borderWidth: 1, justifyContent: 'center', padding: 2},
    toggleThumb: {width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff'},
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        marginTop: 20,
        marginBottom: 30
    },
    logoutText: {fontSize: 18, color: '#ff4444', marginLeft: 10, fontWeight: 'bold'},
});