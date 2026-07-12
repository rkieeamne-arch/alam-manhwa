import { azoraflySourceHandler } from './azorafly';
import { genericSourceHandler } from './generic';
import { rocksMangaSourceHandler } from './rocksmanga';
import { mangatukSourceHandler } from './mangatuk';

export const sources = {
  azorafly: azoraflySourceHandler,
  generic: genericSourceHandler,
  rocksmanga: rocksMangaSourceHandler,
  mangatuk: mangatukSourceHandler,
};

export type SourceId = keyof typeof sources;

export * from './types';
