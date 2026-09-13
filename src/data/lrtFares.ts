// Source: fare matrix supplied by the user. Order is kept exactly as supplied.
export const stations = ['Dukuh Atas BNI', 'Setiabudi', 'Rasuna Said', 'Kuningan', 'Pancoran bank bjb', 'Cikoko', 'Ciliwung', 'Cawang', 'Halim', 'Jati Bening Baru', 'Cikunir 1', 'Cikunir 2', 'Bekasi Barat', 'Jati Mulya', 'Harjamukti', 'Kampung Rambutan', 'Ciracas', 'Taman Mini'];
export const fares = [
 [5000,5000,5700,7100,8500,9900,10600,11300,13400,16200,18300,19000,20000,20000,20000,16200,17600,14800],
 [5000,5000,5000,6400,7800,9200,9900,10600,12700,15500,17600,18300,20000,20000,20000,15500,16900,14100],
 [5700,5000,5000,5000,6400,7800,8500,9200,12000,14100,16200,16900,19700,20000,19700,14800,16200,13400],
 [7100,6400,5000,5000,5700,7100,7800,8500,11300,13400,15500,16200,19000,20000,19000,14100,15500,12700],
 [8500,7800,6400,5700,5000,5700,6400,7100,9200,12000,14100,14800,17600,19700,17600,12700,13400,11300],
 [9900,9200,7800,7100,5700,5000,5000,5700,7800,10600,12700,13400,16200,18300,16200,11300,12000,9900],
 [10600,9900,8500,7800,6400,5000,5000,5000,7100,9900,12000,12700,15500,17600,15500,10600,11300,9200],
 [11300,10600,9200,8500,7100,5700,5000,5000,7100,9200,11300,12000,14800,16900,14800,9900,11300,8500],
 [13400,12700,12000,11300,9200,7800,7100,7100,5000,7100,9200,9900,12000,14800,17600,12000,13400,10600],
 [16200,15500,14100,13400,12000,10600,9900,9200,7100,5000,6400,7100,9200,12000,20000,14800,16200,13400],
 [18300,17600,16200,15500,14100,12700,12000,11300,9200,6400,5000,5000,7800,9900,20000,16900,18300,15500],
 [19000,18300,16900,16200,14800,13400,12700,12000,9900,7100,5000,5000,7100,9200,20000,17600,19000,16200],
 [20000,20000,19700,19000,17600,16200,15500,14800,12000,9200,7800,7100,5000,6400,20000,20000,20000,19000],
 [20000,20000,20000,20000,19700,18300,17600,16900,14800,12000,9900,9200,6400,5000,20000,20000,20000,20000],
 [20000,20000,19700,19000,17600,16200,15500,14800,17600,20000,20000,20000,20000,20000,5000,9200,8500,10600],
 [16200,15500,14800,14100,12700,11300,10600,9900,12000,14800,16900,17600,20000,20000,9200,5000,5700,5700],
 [17600,16900,16200,15500,13400,12000,11300,11300,13400,16200,18300,19000,20000,20000,8500,5700,5000,7100],
 [14800,14100,13400,12700,11300,9900,9200,8500,10600,13400,15500,16200,19000,20000,10600,5700,7100,5000]
];
export const branches = [[0,1,2,3,4,5,6,7,17,15,16,14], [0,1,2,3,4,5,6,7,8,9,10,11,12,13]];
export function routeBetween(from: number, to: number): number[] {
 const graph: number[][] = stations.map(() => []);
 for (const line of branches) for (let i = 1; i < line.length; i++) { graph[line[i-1]].push(line[i]); graph[line[i]].push(line[i-1]); }
 const queue = [[from]], seen = new Set([from]);
 while (queue.length) { const path = queue.shift()!; const last = path[path.length-1]; if (last === to) return path; for (const next of graph[last]) if (!seen.has(next)) { seen.add(next); queue.push([...path,next]); } }
 return [];
}
export const rupiah = (value: number) => `Rp${value.toLocaleString('id-ID')}`;
export const fareBetween = (from: number, to: number, peak: boolean) => Math.min(fares[from][to], peak ? 20000 : 10000);
export function endpointForStation(index: number, from: number | null, to: number | null, preferred: 'from' | 'to'): 'from' | 'to' {
 if (from === null && to === null) return preferred;
 if (from === null) return 'from';
 if (to === null) return 'to';
 const distanceFrom = routeBetween(index, from).length - 1;
 const distanceTo = routeBetween(index, to).length - 1;
 return distanceFrom === distanceTo ? preferred : distanceFrom < distanceTo ? 'from' : 'to';
}
