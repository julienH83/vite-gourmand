const BORDEAUX = "10 Place de la Bourse, 33000 Bordeaux";

async function geocode(address) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", address);
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    headers: { "Accept": "application/json" },
  });
  if (!res.ok) throw new Error("Geocoding failed");
  const data = await res.json();
  if (!data?.length) throw new Error("Address not found");

  return { lat: Number(data[0].lat), lon: Number(data[0].lon) };
}

export async function getDistanceKm(destinationAddress) {
  const [from, to] = await Promise.all([geocode(BORDEAUX), geocode(destinationAddress)]);

  // OSRM public server (routage voiture)
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`;
  const res = await fetch(osrmUrl);
  if (!res.ok) throw new Error("Routing failed");
  const json = await res.json();

  const meters = json?.routes?.[0]?.distance;
  if (typeof meters !== "number") throw new Error("No route found");

  const km = meters / 1000;
  return Math.round(km * 10) / 10; // arrondi 0.1 km
}
