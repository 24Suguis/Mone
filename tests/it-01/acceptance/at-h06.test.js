import {UserService} from "../../../src/domain/service/UserService";
import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach,test } from 'vitest';

let userService;
beforeAll(async () => {
    userService = UserService.getInstance();
    try {
      await userService.logIn("al123456@uji.es", "MiContrasena64");
    } catch (err) {
      await userService.signUp("al123456@uji.es", "Maria", "MiContrasena64");
      await userService.logIn("al123456@uji.es", "MiContrasena64");
    }
});
describe("HU06 - Actualización de datos personales", () => {
  beforeEach(async () => {
    // Estado inicial: un usuario registrado y con sesión abierta
   // await userService.signUp("al123456@uji.es", "Maria", "MiContrasena64");
    //await userService.logIn("al123456@uji.es", "MiContrasena64");
  });

  test("E1 - Válido: el usuario cambia su alias correctamente", async () => {
    const result = await userService.updateCurrentUserProfile("al123456@uji.es", "Mario");
    expect(result).toBe(true);

  });

  test("E2 - Inválido: el usuario introduce un correo inválido", async () => {
    await expect(userService.updateCurrentUserProfile("yo"))
      .rejects.toThrow("InvalidEmailException");
  });
});
