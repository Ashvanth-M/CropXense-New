export type Pt = { x: number; y: number };

function prng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export type Lattice = Pt[][];

/** Perturbed lattice — tessellates into irregular quads like a cadastral sheet. */
export function buildLattice(
  rows: number,
  cols: number,
  w: number,
  h: number,
  inset: number,
  jitter: number,
  seed = 7,
): Lattice {
  const rand = prng(seed);
  const out: Lattice = [];
  for (let r = 0; r <= rows; r++) {
    const row: Pt[] = [];
    for (let c = 0; c <= cols; c++) {
      const bx = inset + ((w - inset * 2) * c) / cols;
      const by = inset + ((h - inset * 2) * r) / rows;
      const edgeX = c === 0 || c === cols;
      const edgeY = r === 0 || r === rows;
      row.push({
        x: bx + (edgeX ? 0 : (rand() - 0.5) * jitter * 2),
        y: by + (edgeY ? 0 : (rand() - 0.5) * jitter * 2),
      });
    }
    out.push(row);
  }
  return out;
}

export type Parcel = {
  r: number;
  c: number;
  d: string;
  centroid: Pt;
  id: string;
};

const VILLAGE = "AK";

export function buildParcels(lat: Lattice, rows: number, cols: number): Parcel[] {
  const parcels: Parcel[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = lat[r]![c]!;
      const b = lat[r]![c + 1]!;
      const cc = lat[r + 1]![c + 1]!;
      const dd = lat[r + 1]![c]!;
      parcels.push({
        r,
        c,
        d: `M${a.x} ${a.y}L${b.x} ${b.y}L${cc.x} ${cc.y}L${dd.x} ${dd.y}Z`,
        centroid: {
          x: (a.x + b.x + cc.x + dd.x) / 4,
          y: (a.y + b.y + cc.y + dd.y) / 4,
        },
        id: `${VILLAGE}-${101 + r * cols + c}/${(c % 3) + 1}`,
      });
    }
  }
  return parcels;
}

export function polyline(points: Pt[]) {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join("");
}
