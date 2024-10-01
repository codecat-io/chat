import { Route } from "@planigale/planigale";
import { Core } from "../../../../core/mod.ts";

export default (_core: Core) =>
  new Route({
    method: "GET",
    url: "/",
    public: true,
    handler: () => {
      return Response.json({ status: "ok" });
    },
  });
