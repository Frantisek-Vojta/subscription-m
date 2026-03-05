import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { router } from 'expo-router';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = () => {
        createUserWithEmailAndPassword(auth, email, password)
            .then(() => {
                router.replace('/(tabs)');
            })
            .catch((error) => {
                if (error.code === 'auth/email-already-in-use') {
                    Alert.alert("Chyba", "Tento email je již registrován.");
                } else if (error.code === 'auth/weak-password') {
                    Alert.alert("Chyba", "Heslo musí mít alespoň 6 znaků.");
                } else {
                    Alert.alert("Chyba", error.message);
                }
            });
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
            />
            <TextInput
                style={styles.input}
                placeholder="Heslo"
                secureTextEntry
                onChangeText={setPassword}
                value={password}
            />
            <Button title="Registrovat se" onPress={handleRegister} />
            <Button
                title="Mám již účet"
                onPress={() => router.back()}
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