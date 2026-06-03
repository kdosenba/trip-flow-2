/**
 * Calculates geodesic points along the great circle path between two lat/lng coordinates.
 * Generates an array of [lng, lat] coordinate pairs.
 */
export function getGeodesicPath(
  start: [number, number],
  end: [number, number],
  numPoints: number = 50,
): [number, number][] {
  const lon1 = (start[0] * Math.PI) / 180;
  const lat1 = (start[1] * Math.PI) / 180;
  const lon2 = (end[0] * Math.PI) / 180;
  const lat2 = (end[1] * Math.PI) / 180;

  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((lat1 - lat2) / 2) ** 2 +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon1 - lon2) / 2) ** 2,
      ),
    );

  const path: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;
    if (d === 0) {
      path.push([start[0], start[1]]);
      continue;
    }
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x =
      A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y =
      A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);

    const lat = Math.atan2(z, Math.sqrt(x ** 2 + y ** 2));
    const lon = Math.atan2(y, x);
    path.push([(lon * 180) / Math.PI, (lat * 180) / Math.PI]);
  }
  return path;
}
