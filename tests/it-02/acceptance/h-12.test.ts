
import { describe, test, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from "vitest";
import { UserService } from "../../../src/domain/service/UserService";

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

describe("Tests aceptación segunda iteración {h12}: RegisterVehicle", () => {
    test("H12-E1 - Válido: el usuario registra un vehículo correctamente",
        async () => {

            // const vehicle = VehicleFactory.createVehicle("Fiat Punto", "fuelCar", "gasoline", 5);
            await expect(
                vehicleService.registerVehicle("al123456@uji.es", "fuelCar", "FiatPunto", "gasoline", 5)
            ).resolves.toBeUndefined();
        },
    );


        test("H12-E2 - Inválido: el usuario registra un vehículo con consumo negativo",
        async () => {

            // const vehicle = VehicleFactory.createVehicle("Fiat Punto", "fuelCar", "gasoline", 5);
            await expect(
                vehicleService.registerVehicle("al123456@uji.es", "fuelCar", "FiatPunto", "gasoline", -2)
            ).rejects.toThrow("Consumo inválido.");
        },
    );
});

