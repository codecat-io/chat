// In this file you can configure migrate-mongo
import { createRequire } from 'node:module';
import { default as appConfig } from '@quack/config';

const config = {
  mongodb: {
    url: appConfig.databaseUrl,
  },
  migrationsDir: 'migrations',
  changelogCollectionName: 'changelog',
  migrationFileExtension: '.js',
  useFileHash: false,
  moduleSystem: 'commonjs',
};

export default config;
