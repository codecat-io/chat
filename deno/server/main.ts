import app from "./app.ts";
import * as path from "@std/path";

const ssl = {};

const __dirname = new URL(".", import.meta.url).pathname;
const sslPath = path.join(__dirname, "../../ssl/");

if (Deno.env.get("SSL")) {
  ssl.key = await Deno.readTextFile(sslPath + "key.pem");
  ssl.cert = await Deno.readTextFile(sslPath + "cert.pem");
}

await app.serve({
  port: 8008,
  ...ssl,
  onListen: (addr: Deno.NetAddr) => {
    console.log(
      `[QUACK API] Listening on http://${addr.hostname}:${addr.port}/`,
    );
  },
});
