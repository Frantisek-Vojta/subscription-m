import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from './firebase';

export const configureGoogleSignIn = () => {
    GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        offlineAccess: true,
    });
};

export const signInWithGoogle = async () => {
    try {
        await GoogleSignin.hasPlayServices();

        const userInfo = await GoogleSignin.signIn();
        console.log('Google user:', userInfo);

        const idToken = userInfo.idToken || userInfo.data?.idToken;

        if (!idToken) {
            throw new Error('No idToken received from Google');
        }

        const { GoogleAuthProvider, signInWithCredential } = await import('firebase/auth');
        const credential = GoogleAuthProvider.credential(idToken);
        return await signInWithCredential(auth, credential);

    } catch (error: any) {
        if (error.code === 'CANCELED') {
            console.log('User cancelled sign in');
            return null;
        }
        console.error('Google Sign-In error:', error);
        throw error;
    }
};

export const signOutFromGoogle = async () => {
    try {
        await GoogleSignin.signOut();
        await auth.signOut();
    } catch (error) {
        console.error('Sign out error:', error);
        throw error;
    }
};