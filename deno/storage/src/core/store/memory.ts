import type { Config } from "@quack/config";
import { ResourceNotFound } from "@planigale/planigale";
import type { FileData, FileOpts } from "../types.ts";

function* idGenerator(): Generator<string> {
  let id = 0;
  while (true) {
    yield `f-${id++}`;
  }
}

interface InternalFileData {
  id: string;
  file: File;
  filename: string;
  contentType: string;
  size: number;
}

export const files = (config: Config["storage"]) => {
  const generator = idGenerator();
  const memory = new Map<string, InternalFileData>();
  return {
    upload: async (
      stream: ReadableStream<Uint8Array>,
      options: FileOpts,
    ): Promise<string> => {
      let data = new Uint8Array();
      let size = 0;
      for await (const chunk of stream) {
        size += chunk.length;
        data = new Uint8Array([...data, ...chunk]);
      }
      if (options.size && size !== options.size) {
        throw new Error("Size mismatch");
      }
      const file = new File([data], options.filename, {
        type: options.contentType,
        lastModified: Date.now(),
      });
      const id: string = options.id ?? generator.next().value;
      memory.set(id, {
        id,
        file,
        filename: options.filename,
        contentType: options.contentType,
        size,
      });
      return id;
    },
    get: (id: string): Promise<FileData> => {
      const file = memory.get(id);
      if (!file) {
        throw new ResourceNotFound("File not found");
      }

      return Promise.resolve({
        ...file,
        get stream() {
          return file.file.stream();
        },
      });
    },
    remove: (id: string): Promise<void> => {
      memory.delete(id);
      return Promise.resolve();
    },
    exists: (id: string): Promise<boolean> => Promise.resolve(memory.has(id)),
  };
};
