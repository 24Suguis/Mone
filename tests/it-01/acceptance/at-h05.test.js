import {UserService} from "../../../src/domain/service/UserService";
import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach,test } from 'vitest';

let userService;
beforeAll(async () => {
    userService = UserService.getInstance();
});

beforeEach(async () => {
  // Simulamos base de datos limpia antes de cada test
  await userService.signUp("al123456@uji.es", "Maria", "MiContrasena64");
});

describe("HU05 - Recuperación de contraseña", () => {
  test("E1 - Válido: cambia la contraseña correctamente", async () => {
    const result = await userService.updatePassword("al123456@uji.es", "deEstaN0Me0lvido");
    expect(result).toBe(true);
    const users = await userService.getRegisteredUsers();
    const user = users.find(u => u.email === "al123456@uji.es");
    expect(user.password).toBe("deEstaN0Me0lvido");
  });

  test("E3 - Inválido: correo no registrado", async () => {
    await expect(userService.updatePassword("123456al@uji.es", "NuevaClave12"))
      .rejects.toThrow("EmailNotFoundException");
  });
});