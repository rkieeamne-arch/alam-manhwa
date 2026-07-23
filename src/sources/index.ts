import { azoraflySourceHandler } from './azorafly';
import { genericSourceHandler } from './generic';
import { rocksMangaSourceHandler } from './rocksmanga';
import { mangatukSourceHandler } from './mangatuk';
import { anime4upSourceHandler } from './anime4up';
import { witanimeSourceHandler } from './witanime';

export const sources = {
  azorafly: azoraflySourceHandler,
  generic: genericSourceHandler,
  rocksmanga: rocksMangaSourceHandler,
  mangatuk: mangatukSourceHandler,
  anime4up: anime4upSourceHandler,
  witanime: witanimeSourceHandler,
};

export type SourceId = keyof typeof sources;

export * from './types';
