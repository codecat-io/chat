import { Config } from '@quack/config';
import { Storage } from '../types.ts';
import createFsStorage from './FsStorage.ts';
import createGcsStorage from './GcsStorage.ts';
import createMemoryStorage from './MemoryStorage.ts';

const getStrategy = (config: Config): ((cfg: Config) => Storage) => {
  switch (config.storage?.type) {
  case 'fs':
    return createFsStorage;
  case 'gcs':
    return createGcsStorage;
  case 'memory':
  default:
    return createMemoryStorage;
  }
};

export default (config: Config): Storage => {
  const Strategy = getStrategy(config);
  return Strategy(config);
};
