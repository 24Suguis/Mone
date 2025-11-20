import { useState } from "react";
import { UserService } from "../domain/service/UserService";

export const useUserViewModel = (onNavigate: (path: string) => void) => {
  const [email, setEmail] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({}); // Errores de validacion

  // intentar obtener UserService de forma segura
  let userService: any = null;
  try {
    userService = UserService.getInstance();
  } catch (err) {
    // Si falla la inicialización, no romperá el hook; se informará al intentar usarlo.
    // Mantener console.warn para facilitar depuración en desarrollo.
    // eslint-disable-next-line no-console
    console.warn("UserService no disponible:", err);
    userService = null;
  }

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = "El email es obligatorio";
    else if (!email.includes("@")) newErrors.email = "Email no válido";
    if (!nickname) newErrors.nickname = "El nickname es obligatorio";
    if (password.length < 6) newErrors.password = "Mínimo 6 caracteres";
    else {
      const passwordRegex =
        /^(?=(?:.*[A-Z]){2,})(?=(?:.*[a-z]){2,})(?=(?:.*\d){2,})[A-Za-z\d!@#$%^&*\(\)\-_=+\[\]\{\}:.\?]{6,}$/;
      if (!passwordRegex.test(password)) {
        newErrors.password =
          "La contraseña debe tener al menos dos mayúsculas, dos minúsculas, dos números y no contener espacios ni comas.";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!email || !nickname || !password || !validate()) {
      setMessage("Por favor, completa todos los campos correctamente.");
      return;
    }
    setLoading(true);

    try {
      if (!userService || typeof userService.signUp !== "function") {
        throw new Error("Servicio de usuario no disponible");
      }
      await userService.signUp(email, nickname, password);
      setMessage("Registro completado con éxito.");
      onNavigate("/login");
    } catch (error) {
      setMessage("Error al registrar el usuario: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    nickname,
    password,
    message,
    loading,
    errors,
    setEmail,
    setNickname,
    setPassword,
    setMessage,
    handleSignUp,
    setLoading,
  };
};
