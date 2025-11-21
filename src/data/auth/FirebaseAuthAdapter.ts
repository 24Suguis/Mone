import type { AuthProvider } from "../../domain/repository/AuthProvider";
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
  verifyBeforeUpdateEmail,
  confirmPasswordReset,
  sendPasswordResetEmail,
} from "firebase/auth";
import type { ActionCodeSettings } from "firebase/auth";
import { firebaseApp, auth, googleProvider } from "../../core/config/firebaseConfig";
import { User } from "../../domain/model/User";
import { UserSession } from "../../domain/session/UserSession";
import { FirebaseError } from "firebase/app";
import { handleAuthError } from "../../core/utils/exceptions";

export class FirebaseAuthAdapter implements AuthProvider {
  private auth = auth;

 async deleteUser(userId: string): Promise<void> {
    const ref = doc(db, "users", userId);
    try {
      await deleteDoc(ref);
    } catch (error) {
      throw new Error(error as Error);
    }
  }


  
}
  async logIn(email: string, password: string): Promise<UserSession> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email.trim(), password.trim());
      const token = await userCredential.user.getIdToken();
      const session = new UserSession(userCredential.user.uid, token);
      if (typeof session.saveToCache === "function") session.saveToCache();
      return session;
    } catch (err) {
      try { console.debug("[FirebaseAuthAdapter.logIn] code:", (err as any)?.code, "message:", (err as any)?.message); } catch {}
      handleAuthError(err as FirebaseError);
    }
  }

  async googleSignIn(): Promise<UserSession> {
    try {
      const provider = googleProvider;
      const userCredential = await signInWithPopup(this.auth, provider);
      const token = await userCredential.user.getIdToken();
      const session = new UserSession(userCredential.user.uid, token);
      if (typeof session.saveToCache === "function") session.saveToCache();

      // guardar perfil en cache (opcional, ya discutido)
      try {
        const profile = { userId: session.userId, email: userCredential.user.email ?? "", nickname: userCredential.user.displayName ?? "", cachedAt: Date.now() };
        if (typeof (UserSession as any).saveProfileToCache === "function") (UserSession as any).saveProfileToCache(profile);
        else localStorage.setItem("user_profile", JSON.stringify(profile));
      } catch { /* ignore */ }

      return session;
    } catch (err) {
      handleAuthError(err as FirebaseError);
    }
  }

  async signUp(user: User, password: string): Promise<string> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, user.getEmail(), password);
      return userCredential.user.uid;
    } catch (err) {
      handleAuthError(err as FirebaseError);
    }
  }

  async updateUserEmail(
    userId: string,
    newEmail: string,
    currentPassword: string,
    actionCodeSettings?: ActionCodeSettings
  ): Promise<void> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser || currentUser.uid !== userId) throw new Error("RequiresRecentLogin");
      const credential = EmailAuthProvider.credential(currentUser.email ?? "", currentPassword ?? "");
      await reauthenticateWithCredential(currentUser, credential);
      await verifyBeforeUpdateEmail(currentUser, newEmail.trim(), actionCodeSettings);
    } catch (err) {
      handleAuthError(err as FirebaseError);
    }
  }

  async canUpdateEmail(userId: string): Promise<boolean> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser || currentUser.uid !== userId) return true;
      await currentUser.reload();
      const providerIds = (currentUser.providerData ?? [])
        .map((provider) => provider?.providerId)
        .filter((id): id is string => Boolean(id));
      if (!providerIds.length) return true;
      return providerIds.includes(EmailAuthProvider.PROVIDER_ID);
    } catch {
      return true;
    }
  }
}
