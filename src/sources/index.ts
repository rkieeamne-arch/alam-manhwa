import { azoraflySourceHandler } from './azorafly';
import { olympusStaffSource } from './olympustaff';
import { genericSourceHandler } from './generic';

export const sources = {
  azorafly: azoraflySourceHandler,
  olympustaff: olympusStaffSource,
  generic: genericSourceHandler,
};

export type SourceId = keyof typeof sources;

export * from './types';
