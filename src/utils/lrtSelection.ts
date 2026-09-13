import { endpointForStation } from '../data/lrtFares';

export type Endpoint = 'from' | 'to';
export type StationSelection = {
 from: number | null;
 to: number | null;
 target: Endpoint;
};

export function selectionAfterClick(state: StationSelection, index: number): StationSelection {
 const { from, to, target } = state;
 const endpoint = endpointForStation(index, from, to, target);
 return selectionAfterDrop(state, endpoint, index);
}

export function selectionAfterDrop(state: StationSelection, endpoint: Endpoint, index: number | null): StationSelection {
 if (index === null) return state;
 return { ...state, [endpoint]: index, target: endpoint === 'from' ? 'to' : 'from' };
}
