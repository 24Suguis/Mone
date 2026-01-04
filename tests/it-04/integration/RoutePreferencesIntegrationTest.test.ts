import { describe, test, expect, beforeEach, afterEach, vi, type SpyInstance } from "vitest";
import { UserDefaultOptionsService } from "../../../src/domain/service/UserDefaultOptionsService";
import { VehicleService } from "../../../src/domain/service/VehicleService";

const USER_ID = "user-123";

const DEFAULT_OPTIONS = {
	transportMode: "vehicle",
	routeType: "fastest",
	vehicleName: null,
};

type UserDefaultOptionsRepositoryMock = {
	getDefaultOptions: ReturnType<typeof vi.fn>;
	saveDefaultOptions: ReturnType<typeof vi.fn>;
};

type VehicleServiceMock = {
	getVehicles: ReturnType<typeof vi.fn>;
};

const mockNavigator = (online: boolean) => {
	Object.defineProperty(globalThis, "navigator", {
		value: { onLine: online } as Navigator,
		configurable: true,
	});
};

describe("H24-H28: UserDefaultOptions integration", () => {
	let repo: UserDefaultOptionsRepositoryMock;
	let vehicleService: VehicleServiceMock;
	let service: UserDefaultOptionsService;
	let vehicleSpy: SpyInstance;

	beforeEach(() => {
		repo = {
			getDefaultOptions: vi.fn().mockResolvedValue(DEFAULT_OPTIONS),
			saveDefaultOptions: vi.fn().mockResolvedValue(undefined),
		};

		vehicleService = {
			getVehicles: vi.fn().mockResolvedValue([]),
		};

		vehicleSpy = vi.spyOn(VehicleService, "getInstance").mockReturnValue(vehicleService as any);
		service = new UserDefaultOptionsService(repo as any);
		mockNavigator(true);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		delete (globalThis as any).navigator;
	});

	describe("{HU24} Transporte por defecto", () => {
		test("HU24-E2 - Válido: establece bicicleta como método por defecto", async () => {
			await service.save(USER_ID, { transportMode: "bike" });

			expect(repo.saveDefaultOptions).toHaveBeenCalledWith(USER_ID, {
				transportMode: "bike",
				routeType: "fastest",
				vehicleName: null,
			});
		});

		test("HU24-E3 - Inválido: rechaza modos desconocidos", async () => {
			await expect(
				service.save(USER_ID, { transportMode: "Autobús" as any })
			).rejects.toThrow("MobilityTypeNotFoundException");

			expect(repo.saveDefaultOptions).not.toHaveBeenCalled();
		});
	});

	describe("{HU25} Tipo de ruta por defecto", () => {
		test("HU25-E1 - Válido: guarda 'fastest'", async () => {
			await service.save(USER_ID, { routeType: "fastest" });

			expect(repo.saveDefaultOptions).toHaveBeenCalledWith(USER_ID, {
				transportMode: "vehicle",
				routeType: "fastest",
				vehicleName: null,
			});
		});

		test("HU25-E5 - Inválido: lanza error si navigator está offline", async () => {
			mockNavigator(false);

			await expect(service.save(USER_ID, { routeType: "fastest" })).rejects.toThrow(
				"DatabaseNotAvailableException"
			);

			mockNavigator(true);
			await service.get(USER_ID);
			expect(repo.saveDefaultOptions).not.toHaveBeenCalled();
		});
	});

	describe("{HU28} Vehículo por defecto", () => {
		test("HU28-E1 - Válido: usa un vehículo registrado", async () => {
			vehicleService.getVehicles.mockResolvedValueOnce([
				{ name: "Mercedes" },
			] as any);

			await service.save(USER_ID, {
				transportMode: "vehicle",
				vehicleName: "Mercedes",
			});

			expect(vehicleService.getVehicles).toHaveBeenCalledWith(USER_ID);
			expect(repo.saveDefaultOptions).toHaveBeenCalledWith(USER_ID, {
				transportMode: "vehicle",
				routeType: "fastest",
				vehicleName: "Mercedes",
			});
		});

		test("HU28-E3 - Inválido: falla si el vehículo no existe", async () => {
			vehicleService.getVehicles.mockResolvedValueOnce([]);

			await expect(
				service.save(USER_ID, {
					transportMode: "vehicle",
					vehicleName: "Mercedes",
				})
			).rejects.toThrow("VehicleNotFoundException");

			expect(repo.saveDefaultOptions).not.toHaveBeenCalled();
		});
	});
});
