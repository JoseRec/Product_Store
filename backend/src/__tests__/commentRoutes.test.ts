// Mock Clerk middleware so routes can be registered without real Clerk setup
jest.mock("@clerk/express", () => ({
  requireAuth: () => (_req: any, _res: any, next: any) => next(),
  clerkMiddleware: () => (_req: any, _res: any, next: any) => next(),
  getAuth: jest.fn(),
}));

// Mock comment controller handlers
jest.mock("../controllers/commentController", () => ({
  createComment: jest.fn((_req: any, res: any) => res.status(201).json({ id: "c1" })),
  deleteComment: jest.fn((_req: any, res: any) => res.status(200).json({ message: "deleted" })),
}));

import commentRouter from "../routes/commentRoutes";
import * as commentController from "../controllers/commentController";

// Helper to extract route info from Express router stack
interface RouteInfo {
  path: string;
  methods: string[];
  handlers: Function[];
}

function getRoutes(router: any): RouteInfo[] {
  return router.stack
    .filter((layer: any) => layer.route)
    .map((layer: any) => ({
      path: layer.route.path as string,
      methods: Object.keys(layer.route.methods) as string[],
      handlers: layer.route.stack.map((h: any) => h.handle) as Function[],
    }));
}

describe("commentRoutes", () => {
  it("registers exactly 2 routes", () => {
    const routes = getRoutes(commentRouter);
    expect(routes).toHaveLength(2);
  });

  describe("POST /:productId route", () => {
    it("registers a POST route with path '/:productId'", () => {
      const routes = getRoutes(commentRouter);
      const postRoute = routes.find(
        (r) => r.methods.includes("post") && r.path === "/:productId"
      );
      expect(postRoute).toBeDefined();
    });

    it("includes the createComment controller as a handler", () => {
      const routes = getRoutes(commentRouter);
      const postRoute = routes.find(
        (r) => r.methods.includes("post") && r.path === "/:productId"
      );
      expect(postRoute!.handlers).toContain(commentController.createComment);
    });

    it("does not register POST at the root path '/'", () => {
      const routes = getRoutes(commentRouter);
      const rootPost = routes.find(
        (r) => r.methods.includes("post") && r.path === "/"
      );
      expect(rootPost).toBeUndefined();
    });
  });

  describe("DELETE /:id route", () => {
    it("registers a DELETE route with path '/:id'", () => {
      const routes = getRoutes(commentRouter);
      const deleteRoute = routes.find(
        (r) => r.methods.includes("delete") && r.path === "/:id"
      );
      expect(deleteRoute).toBeDefined();
    });

    it("includes the deleteComment controller as a handler", () => {
      const routes = getRoutes(commentRouter);
      const deleteRoute = routes.find(
        (r) => r.methods.includes("delete") && r.path === "/:id"
      );
      expect(deleteRoute!.handlers).toContain(commentController.deleteComment);
    });
  });

  describe("route parameter naming (regression)", () => {
    it("uses 'productId' as the param name on the POST route (not a static segment)", () => {
      const routes = getRoutes(commentRouter);
      const postRoute = routes.find(
        (r) => r.methods.includes("post") && r.path === "/:productId"
      );
      // path must be the dynamic /:productId, not a static like /create
      expect(postRoute!.path).toMatch(/^\/:/);
    });

    it("uses 'id' as the param name on the DELETE route", () => {
      const routes = getRoutes(commentRouter);
      const deleteRoute = routes.find(
        (r) => r.methods.includes("delete") && r.path === "/:id"
      );
      expect(deleteRoute!.path).toBe("/:id");
    });
  });
});