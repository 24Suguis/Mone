//USERSERVICE QUE PASA LAS PRUBEAS;)
import { auth, googleProvider } from "../../core/config/firebaseConfig";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    signInWithPopup,
    type UserCredential,
} from "firebase/auth";
//para evitar errores de tipo en el manejo de errores (lo rojo)
import type { User } from "../model/User";
import type { FirebaseError } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

export class UserService {

    //Patron de diseño Singleton, discutir su uso mas tarde
    private static instance: UserService;

    private constructor() { } // evita instanciación directa

    public static getInstance(): UserService {
       if (!UserService.instance) {
           UserService.instance = new UserService();
       }
       return UserService.instance;
    }
    async signUp(email: string, nickname: string, password: string): Promise<UserCredential> {
           throw new Error("NotImplementedException");

    }

    async logIn(email: string, password: string): Promise<UserCredential> {
              throw new Error("NotImplementedException");

    }

    async logOut(): Promise<boolean> {
              throw new Error("NotImplementedException");

    }
    async deleteUser(email: string): Promise<boolean> {
              throw new Error("NotImplementedException");

    }

    async getRegisteredUsers(): Promise<Array<User>> {
              throw new Error("NotImplementedException");
    }

    async updatePassword(email: string, newPassword: string): Promise<boolean> {
              throw new Error("NotImplementedException");
    }


    async googleSignIn(): Promise<UserCredential> {
              throw new Error("NotImplementedException");

    }

    // Centralizamos los errores para no repetir código
    private handleAuthError(error: FirebaseError): never {
       throw new Error("NotImplementedException");
    }
}