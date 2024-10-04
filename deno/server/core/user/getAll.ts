import * as v from "valibot";
import { createQuery } from "../query.ts";
import { Id } from "../types.ts";

export default createQuery({
  type: "users:getAll",
  body: v.optional(v.any()),
}, async (_body, { repo }) => await repo.user.getAll({}));
