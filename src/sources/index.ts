import { azoraflySourceHandler } from './azorafly';
import { genericSourceHandler } from './generic';
import { rocksMangaSourceHandler } from './rocksmanga';
import { mangatukSourceHandler } from './mangatuk';
import { anime4upSourceHandler } from './anime4up';
import { witanimeSourceHandler } from './witanime';
import { animercoSourceHandler } from './animerco';

export const sources = {
  azorafly: azoraflySourceHandler,
  generic: genericSourceHandler,
  rocksmanga: rocksMangaSourceHandler,
  mangatuk: mangatukSourceHandler,
  anime4up: anime4upSourceHandler,
  witanime: witanimeSourceHandler,
  animerco: animercoSourceHandler,
};

export type SourceId = keyof typeof sources;

export * from './types';
