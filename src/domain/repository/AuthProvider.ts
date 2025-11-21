import { UserSession } from "../../domain/session/UserSession";
import { User } from "../../domain/model/User";
export interface AuthProvider {
  signUp(user: User, password: string): Promise<string>;
  logIn(email: string, password: string): Promise<UserSession>;
  googleSignIn(): Promise<UserSession>;
  updateUserEmail(
    userId: string,
    newEmail: string,
    currentPassword: string
  ): Promise<void>;
}
