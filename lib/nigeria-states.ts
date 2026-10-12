export const NIGERIA_STATE_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  "Abia":        { lat:  5.4527, lng:  7.5248 },
  "Adamawa":     { lat:  9.3265, lng: 12.3984 },
  "Akwa Ibom":   { lat:  4.9057, lng:  7.8537 },
  "Anambra":     { lat:  6.2209, lng:  6.9370 },
  "Bauchi":      { lat: 10.3158, lng:  9.8442 },
  "Bayelsa":     { lat:  4.7719, lng:  6.0699 },
  "Benue":       { lat:  7.3369, lng:  8.7399 },
  "Borno":       { lat: 11.8333, lng: 13.1500 },
  "Cross River": { lat:  5.8702, lng:  8.5988 },
  "Delta":       { lat:  5.5320, lng:  5.8987 },
  "Ebonyi":      { lat:  6.3249, lng:  8.1137 },
  "Edo":         { lat:  6.3350, lng:  5.6037 },
  "Ekiti":       { lat:  7.7190, lng:  5.3110 },
  "Enugu":       { lat:  6.4584, lng:  7.5464 },
  "FCT - Abuja": { lat:  9.0579, lng:  7.4951 },
  "Gombe":       { lat: 10.2791, lng: 11.1670 },
  "Imo":         { lat:  5.4921, lng:  7.0260 },
  "Jigawa":      { lat: 12.2280, lng:  9.5616 },
  "Kaduna":      { lat: 10.5264, lng:  7.4382 },
  "Kano":        { lat: 12.0022, lng:  8.5920 },
  "Katsina":     { lat: 12.9816, lng:  7.6184 },
  "Kebbi":       { lat: 12.4538, lng:  4.1975 },
  "Kogi":        { lat:  7.8004, lng:  6.7399 },
  "Kwara":       { lat:  8.4966, lng:  4.5421 },
  "Lagos":       { lat:  6.5244, lng:  3.3792 },
  "Nasarawa":    { lat:  8.4966, lng:  8.1997 },
  "Niger":       { lat:  9.6139, lng:  6.5569 },
  "Ogun":        { lat:  6.9980, lng:  3.4737 },
  "Ondo":        { lat:  6.9149, lng:  5.1478 },
  "Osun":        { lat:  7.5629, lng:  4.5200 },
  "Oyo":         { lat:  7.3775, lng:  3.9470 },
  "Plateau":     { lat:  9.2182, lng:  9.5179 },
  "Rivers":      { lat:  4.8156, lng:  7.0498 },
  "Sokoto":      { lat: 13.0059, lng:  5.2476 },
  "Taraba":      { lat:  7.9994, lng: 10.7744 },
  "Yobe":        { lat: 12.2939, lng: 11.4390 },
  "Zamfara":     { lat: 12.1704, lng:  6.6670 },
}

/** Returns the name of the Nigerian state whose centroid is closest to the given coordinates. */
export function findNearestState(lat: number, lng: number): string | null {
  let nearest: string | null = null
  let minDist = Infinity
  const latR = lat * Math.PI / 180
  for (const [name, c] of Object.entries(NIGERIA_STATE_CENTROIDS)) {
    const dLat = (c.lat - lat) * Math.PI / 180
    const dLng = (c.lng - lng) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(latR) * Math.cos(c.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
    const dist = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    if (dist < minDist) { minDist = dist; nearest = name }
  }
  return nearest
}
