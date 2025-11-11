import {logIn} from "../src/domain/service/UserService.ts";

beforeEach(async () => {
  await registerUser("al123456@uji.es", "Maria", "MiContrasena64");
});

describe("HU02 - Inicio de sesión", () => {
  test("E1 - Válido: inicia sesión correctamente", async () => {
    const result = await logIn("al123456@uji.es", "MiContrasena64");
    expect(result.sessionOpen).toBe(true);
  });

  test("E2 - Inválido: contraseña incorrecta", async () => {
    await expect(logIn("al123456@uji.es", "micontraseña"))
      .rejects.toThrow("InvalidDataException");
  });

  test("E2b - Inválido: correo no registrado", async () => {
    await expect(logIn("al987654@uji.es", "Codigo1Secreto2"))
      .rejects.toThrow("EmailNotFoundException");
  });
});