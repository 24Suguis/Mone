import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { RouteService } from "../../../src/domain/service/RouteService";
import type { RouteRepository, RouteSavedDTO } from "../../../src/domain/repository/RouteRespository";
import { UserSession } from "../../../src/domain/session/UserSession";

class InMemoryRepo implements RouteRepository {
	constructor(private readonly routes: Record<string, RouteSavedDTO[]> = {}) {}

	async saveRoute(userId: string, payload: RouteSavedDTO): Promise<string> {
		const id = payload.id ?? crypto.randomUUID?.() ?? `r-${Date.now()}`;
		const list = this.routes[userId] ?? [];
		this.routes[userId] = [...list, { ...payload, id }];
		return id;
	}

	async listRoutes(userId: string): Promise<RouteSavedDTO[]> {
		return (this.routes[userId] ?? []).map((r) => ({ ...r }));
	}

	async deleteRoute(userId: string, routeId: string): Promise<void> {
		const list = this.routes[userId] ?? [];
		const next = list.filter((r) => r.id !== routeId);
		if (next.length === list.length) throw new Error("RouteNotFoundException");
		this.routes[userId] = next;
	}

	async getRoute(userId: string, routeId: string): Promise<RouteSavedDTO | null> {
		const found = (this.routes[userId] ?? []).find((r) => r.id === routeId) || null;
		return found ? { ...found } : null;
	}

	async updateRoute(userId: string, routeId: string, payload: RouteSavedDTO): Promise<void> {
		const list = this.routes[userId] ?? [];
		const idx = list.findIndex((r) => r.id === routeId);
		if (idx === -1) throw new Error("RouteNotFoundException");
		list[idx] = { ...list[idx], ...payload };
		this.routes[userId] = list;
	}
}

const ensureLocalStorage = () => {
	if (typeof globalThis.localStorage !== "undefined") return;
	const store = new Map<string, string>();
	globalThis.localStorage = {
		getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
		setItem: (key: string, value: string) => { store.set(key, value); },
		removeItem: (key: string) => { store.delete(key); },
		clear: () => { store.clear(); },
		key: (index: number) => Array.from(store.keys())[index] ?? null,
		get length() { return store.size; },
	} as unknown as Storage;
};

describe("RouteService integration", () => {
	beforeAll(() => {
		ensureLocalStorage();
	});

	beforeEach(() => {
		UserSession.clear();
		// reset singleton between tests
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		RouteService.instance = null;
	});

	it("listSavedRoutes uses provided userId when no session", async () => {
		const repo = new InMemoryRepo({
			userA: [
				{
					id: "r1",
					name: "Castellón-Valencia",
					origin: "39.98627,-0.004778",
					destination: "39.477,-0.376",
					mobilityType: "vehicle",
					mobilityMethod: "vehicle",
					routeType: "fastest",
				},
			],
		});

		const service = RouteService.getInstance({ repository: repo });

		const routes = await service.listSavedRoutes("userA");

		expect(routes).toHaveLength(1);
		expect(routes[0].name).toBe("Castellón-Valencia");
	});

	it("deleteSavedRoute throws when route does not exist", async () => {
		new UserSession("userA", "token").saveToCache();
		const repo = new InMemoryRepo({ userA: [] });
		const service = RouteService.getInstance({ repository: repo });

		await expect(service.deleteSavedRoute("missing")).rejects.toThrowError("RouteNotFoundException");
	});

	it("saveRoute uses session user id when none is passed", async () => {
		const repo = new InMemoryRepo();
		new UserSession("userB", "token").saveToCache();
		const service = RouteService.getInstance({ repository: repo });

		const routeId = await service.saveRoute({
			name: "Ruta con sesión",
			origin: "39.0,0.1",
			destination: "39.1,0.2",
			mobilityType: "vehicle",
			routeType: "fastest",
		});

		const stored = await service.listSavedRoutes("userB");
		expect(stored).toHaveLength(1);
		expect(stored[0].id).toBe(routeId);
	});

	it("saveRoute throws when no session and user id is omitted", async () => {
		UserSession.clear();
		const repo = new InMemoryRepo();
		const service = RouteService.getInstance({ repository: repo });

		await expect(
			service.saveRoute({
				name: "Sin sesión",
				origin: "39.0,0.1",
				destination: "39.1,0.2",
				mobilityType: "vehicle",
				routeType: "fastest",
			})
		).rejects.toThrowError("User session not found");
	});

	it("updateSavedRoute applies trimmed name and defaults mobilityMethod", async () => {
		const repo = new InMemoryRepo({
			userC: [
				{
					id: "r-edit",
					name: "Old",
					origin: "39.0,0.1",
					destination: "39.1,0.2",
					mobilityType: "vehicle",
					mobilityMethod: "vehicle",
					routeType: "fastest",
				},
			],
		});
		const service = RouteService.getInstance({ repository: repo });

		await service.updateSavedRoute(
			"r-edit",
			{
				name: "  Nuevo nombre  ",
				origin: "39.0,0.1",
				destination: "39.1,0.2",
				mobilityType: "bike",
				routeType: "shortest",
			},
			"userC"
		);

		const updated = await service.getSavedRoute("r-edit", "userC");
		expect(updated?.name).toBe("Nuevo nombre");
		expect(updated?.mobilityMethod).toBe("bike");
	});

	it("updateSavedRoute throws RouteNotFoundException when route missing", async () => {
		const repo = new InMemoryRepo({ userD: [] });
		const service = RouteService.getInstance({ repository: repo });

		await expect(
			service.updateSavedRoute(
				"not-there",
				{
					name: "X",
					origin: "39.0,0.1",
					destination: "39.1,0.2",
					mobilityType: "walk",
					routeType: "fastest",
				},
				"userD"
			)
		).rejects.toThrowError("RouteNotFoundException");
	});
});

