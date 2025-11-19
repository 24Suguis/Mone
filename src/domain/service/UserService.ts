//USERSERVICE QUE PASA LAS PRUBEAS;)
import type { AuthProvider } from "../repository/AuthProvider";
import type { UserRepository } from "../repository/UserRepository";
import { FirebaseAuthAdapter } from "../../data/auth/FirebaseAuthAdapter";
import { UserSession } from "../session/UserSession";
import { UserRepositoryFirebase } from "../../data/repository/UserRepositoryFirebase";
import { User } from "../model/User";
//para evitar errores de tipo en el manejo de errores (lo rojo)
import type { FirebaseError } from "firebase/app";
import {
  validatePassword,
  isValidEmail,
  isValidNickname,
} from "../../core/utils/validators";
import { handleAuthError } from "../../core/utils/exceptions";

export class UserService {
  private static instance: UserService;
  private authProvider!: AuthProvider;
  private userRepository!: UserRepository;

  private constructor() {}

  public static getInstance(
    authProvider?: AuthProvider,
    repProvider?: UserRepository
  ): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
      UserService.instance.authProvider =
        authProvider ?? new FirebaseAuthAdapter();
      UserService.instance.userRepository =
        repProvider ?? new UserRepositoryFirebase();
    } else {
      // Permitir reemplazar providers si se pasan
      if (authProvider) UserService.instance.authProvider = authProvider;
      if (repProvider) UserService.instance.userRepository = repProvider;
    }
    return UserService.instance;
  }

  
  processResetParamsFromUrl(search: string) {
    const params = new URLSearchParams(search);
    const mode = params.get("mode") || undefined;
    const oobCode = params.get("oobCode") || undefined;
    const continueUrl = params.get("continueUrl") || undefined;

    const result: {
      mode?: string;
      oobCode?: string;
      continueUrl?: string;
      shouldRedirect: boolean;
      redirectQuery?: string;
    } = {
      mode,
      oobCode,
      continueUrl,
      shouldRedirect: false,
    };

    if (mode === "resetPassword" && oobCode) {
      const q = new URLSearchParams();
      q.set("oobCode", oobCode);
      if (continueUrl) q.set("continueUrl", continueUrl);
      result.shouldRedirect = true;
      result.redirectQuery = q.toString();
    }

    return result;
  }

 
  async changePassword(payload: {
    currentPassword?: string;
    newPassword: string;
     oobCode?: string;
  }): Promise<void> {
    const { oobCode, currentPassword, newPassword } = payload;
    if (!newPassword || !validatePassword(newPassword)) {
      throw new Error("InvalidDataException");
    }

    try {
      await this.authProvider.changeUserPassword(currentPassword ?? null, newPassword, oobCode);
    } catch (error) {
      handleAuthError(error as FirebaseError);
    }
  }
}
