import type { AuthProvider } from "../../domain/repository/AuthProvider";
import { FirebaseError } from "firebase/app";
import { handleAuthError } from "../../core/utils/exceptions";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  confirmPasswordReset,
  sendPasswordResetEmail,
  type ActionCodeSettings,
} from "firebase/auth";
import { firebaseApp } from "../../core/config/firebaseConfig";
import { User } from "../../domain/model/User";
import { UserSession } from "../../domain/session/UserSession";

export class FirebaseAuthAdapter implements AuthProvider {
  private auth = getAuth(firebaseApp);

  async changeUserPassword(
    currentPassword: string | null,
    newPassword: string,
    oobCode?: string // código del enlace enviado por email
  ): Promise<void> {
    const auth = getAuth(firebaseApp);

    // Usuario vino desde el email
    if (oobCode) {
      try {
        await confirmPasswordReset(auth, oobCode, newPassword);
        return;
      }catch (Error) {
        throw handleAuthError(Error as FirebaseError);
      }
    }

    // Usuario autenticado que proporciona la contraseña actual
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Usuario no autenticado");
    }

    const email = user.email;
    if (!email) {
      throw new Error("Email del usuario no disponible para reautenticación");
    }

    if (!currentPassword) {
      throw new Error("Se requiere la contraseña actual para cambiarla");
    }

    try {
      const credential = EmailAuthProvider.credential(email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
    }  catch (Error) {
        throw handleAuthError(Error as FirebaseError);
    }
  }
  
  async sendPasswordResetLink(
    email: string,
    actionCodeSettings?: ActionCodeSettings
  ): Promise<void> {
    const auth = getAuth(firebaseApp);
    try {
      if (actionCodeSettings) {
        await sendPasswordResetEmail(auth, email, actionCodeSettings);
      } else {
        await sendPasswordResetEmail(auth, email);
      }
    }  catch (Error) {
        throw handleAuthError(Error as FirebaseError);
    }
  }
}
