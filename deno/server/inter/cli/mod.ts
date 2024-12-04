import { Command } from "jsr:@cliffy/command@1.0.0-rc.5";

const run = new Command()
  .arguments("<config:string>")
  .description("Runs the chat server.")
  .action((options: any, source: string, destination?: string) => {
    console.log("clone command called");
  });

await new Command()
  .name("chat")
  .version("0.1.0")
  .description("Private chat server")
  .usage("<command:string>")
  .arguments("<command:string>")
  .command("run", run)
  .parse(Deno.args);
