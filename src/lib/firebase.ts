import { initializeApp } from "firebase/app";
import type { FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

type FirebaseAppletConfig = FirebaseOptions;

const typedFirebaseConfig = firebaseConfig as FirebaseAppletConfig;

const app = initializeApp(typedFirebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    throw error;
  }
};

export const logout = () => signOut(auth);
