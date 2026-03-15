import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { User } from 'firebase/auth';

export default function Profile() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState('');
    const [editingUsername, setEditingUsername] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const { auth } = await import('../../config/firebase');
            const currentUser = auth.currentUser;
            setUser(currentUser);
            const initialUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
            setUsername(initialUsername);
            setNewUsername(initialUsername);
        } catch (error) {
            console.log('Load user error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUsername = async () => {
        try {
            const { auth } = await import('../../config/firebase');
            const { updateProfile } = await import('firebase/auth');

            if (auth.currentUser) {
                await updateProfile(auth.currentUser, {
                    displayName: newUsername
                });
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

            const { auth } = await import('../../config/firebase');
            const { sendPasswordResetEmail } = await import('firebase/auth');

            if (user?.email) {
                await sendPasswordResetEmail(auth, user.email);
                setPasswordMessage('Password reset link sent to your email');
            } else {
                Alert.alert('Error', 'No email address found');
            }
        } catch (error: any) {
            console.log('Password reset error:', error);
            setPasswordMessage('Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            setLoading(true);

            const { auth } = await import('../../config/firebase');
            const { signOut } = await import('firebase/auth');

            await signOut(auth);
            router.replace('/(auth)/login');

        } catch (error: any) {
            console.log('Logout error:', error);
            Alert.alert('Error', error.message || 'Failed to logout');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }
    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    {user?.photoURL ? (
                        <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                    ) : (
                        <FontAwesome name="user-circle" size={100} color="#666" />
                    )}
                </View>

                {editingUsername ? (
                    <View style={styles.usernameEditContainer}>
                        <TextInput
                            style={styles.usernameInput}
                            value={newUsername}
                            onChangeText={setNewUsername}
                            autoFocus
                        />
                        <View style={styles.usernameEditButtons}>
                            <TouchableOpacity onPress={() => setEditingUsername(false)}>
                                <FontAwesome name="times" size={24} color="#ff4444" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleUpdateUsername}>
                                <FontAwesome name="check" size={24} color="#00C851" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.usernameContainer}>
                        <Text style={styles.username}>{username}</Text>
                        <TouchableOpacity onPress={() => setEditingUsername(true)}>
                            <FontAwesome name="pencil" size={20} color="#2196F3" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account Information</Text>

                <View style={styles.infoRow}>
                    <FontAwesome name="envelope" size={20} color="#666" style={styles.icon} />
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.value}>{user?.email}</Text>
                </View>

                <View style={styles.infoRow}>
                    <FontAwesome name="lock" size={20} color="#666" style={styles.icon} />
                    <Text style={styles.label}>Password</Text>
                    <Text style={styles.value}>••••••••</Text>
                </View>

                <View style={styles.infoRow}>
                    <FontAwesome name="check-circle" size={20} color="#666" style={styles.icon} />
                    <Text style={styles.label}>Verified</Text>
                    <Text style={[styles.value, user?.emailVerified ? styles.verified : styles.notVerified]}>
                        {user?.emailVerified ? 'Yes' : 'No'}
                    </Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Security</Text>

                <TouchableOpacity style={styles.actionButton} onPress={handleChangePassword}>
                    <FontAwesome name="key" size={20} color="#666" style={styles.icon} />
                    <Text style={styles.actionButtonText}>Change Password</Text>
                    <FontAwesome name="chevron-right" size={20} color="#666" />
                </TouchableOpacity>

                {passwordMessage ? (
                    <Text style={[styles.message, passwordMessage.includes('✅') ? styles.successMessage : styles.errorMessage]}>
                        {passwordMessage}
                    </Text>
                ) : null}
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <FontAwesome name="sign-out" size={20} color="#ff4444" />
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: '#f8f9fa',
    },
    avatarContainer: {
        marginBottom: 15,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    usernameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        marginRight: 10,
    },
    usernameEditContainer: {
        alignItems: 'center',
    },
    usernameInput: {
        fontSize: 20,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        width: 200,
        textAlign: 'center',
        marginBottom: 10,
    },
    usernameEditButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
    },
    section: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        paddingVertical: 5,
    },
    icon: {
        width: 30,
    },
    label: {
        fontSize: 16,
        color: '#666',
        width: 80,
    },
    value: {
        fontSize: 16,
        flex: 1,
    },
    verified: {
        color: '#00C851',
    },
    notVerified: {
        color: '#ff4444',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    actionButtonText: {
        fontSize: 16,
        flex: 1,
        marginLeft: 15,
    },
    message: {
        fontSize: 14,
        textAlign: 'center',
        padding: 10,
        marginTop: 10,
        borderRadius: 5,
    },
    successMessage: {
        backgroundColor: '#d4edda',
        color: '#155724',
    },
    errorMessage: {
        backgroundColor: '#f8d7da',
        color: '#721c24',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        marginTop: 20,
        marginBottom: 30,
    },
    logoutText: {
        fontSize: 18,
        color: '#ff4444',
        marginLeft: 10,
        fontWeight: 'bold',
    },
});