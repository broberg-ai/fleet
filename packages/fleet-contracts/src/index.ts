export * from './intercom';
export * from './terminal';
export * from './notify';
export * from './board';

/**
 * Canonical method + path + serving daemon for each fleet endpoint, so the
 * client (F072.3) and the server (F072.5) share ROUTING as well as shapes.
 * `server` tells the reachability transport which daemon owns the route.
 */
export const FLEET_ENDPOINTS = {
  intercomDispatch: { method: 'POST', path: '/api/intercom/dispatch', server: 'buddy' },
  terminalProvision: { method: 'POST', path: '/api/terminal/provision', server: 'buddy' },
  notifyMobile: { method: 'POST', path: '/api/notify', server: 'buddy' },
  boardDigest: { method: 'GET', path: '/api/board/digest', server: 'cardmem' },
  submitIdea: { method: 'POST', path: '/api/board/idea', server: 'cardmem' },
} as const;

export type FleetEndpointName = keyof typeof FLEET_ENDPOINTS;
