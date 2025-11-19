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

  async signUp(
    email: string,
    nickname: string,
    password: string
  ): Promise<string> {
    if (
      !validatePassword(password) ||
      !isValidEmail(email) ||
      !isValidNickname(nickname)
    ) {
      throw new Error("InvalidDataException");
    }
    try {
      const user = new User(email, nickname);
      const userId = await this.authProvider.signUp(user, password); //email + password
      await this.userRepository.saveUser(userId, user); //email + nickname
      return userId;
    } catch (error) {
      handleAuthError(error as FirebaseError);
      return ""; // Esto es solo para satisfacer el compilador; el flujo no debería llegar aquí
    }
  }
}
