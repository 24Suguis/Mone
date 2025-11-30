
import { describe, test, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from "vitest";
import { UserService } from "../../../src/domain/service/UserService";

import type { Vehicle } from "../../../src/domain/model/VehicleInterface";
import { VehicleService } from "../../../src/domain/service/VehicleService";

import { VehicleRepositoryFirebase } from "../../../src/data/repository/VehicleRepositoryFirebase";
const vehicleService = VehicleService.getInstance(new VehicleRepositoryFirebase());
const userService = UserService.getInstance();

beforeAll(async () => {
    // Crear usuario de prueba e iniciar sesión
    try {
       // await userService.signUp("al123456@uji.es", "Maria", "MiContrasena64");
        await userService.logIn("al123456@uji.es", "MiContrasena64");
    } catch (error) {
        console.error("Error en beforeAll:", error);
    }

});

describe("Tests aceptación segunda iteración {h14}: DeleteVehicle", () => {
    test("H14-E1 - Válido: el usuario elimina su vehículo correctamente",
        async () => {
            //a la segunda fallará ya que ya lo ha borrado
            await expect(vehicleService.deleteVehicle("al123456@uji.es", "FiatPunto")).resolves.toBeUndefined();
        },
    );

    test("H14-E2 - Inválido: el usuario intenta eliminar un vehículo que no posee",
        async () => {
            await expect(vehicleService.deleteVehicle("al123456@uji.es", "Vehículo Inexistente")).rejects.toThrow("VehicleNotFoundException");
        },
    );

   
});
