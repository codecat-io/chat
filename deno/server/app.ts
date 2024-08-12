import { HttpInterface } from "./inter/http/mod.ts";
import { Core } from "./core/mod.ts";

const core = new Core();
const http = new HttpInterface(core);

http.onClose(async () => {
  await core.close();
});

export default http;
