const services = [
  ["api-gateway", 3000],
  ["auth-service", 4001],
  ["user-service", 4002],
  ["course-service", 4003],
  ["progress-service", 4004],
  ["recommendation-service", 4005],
  ["interaction-service", 4006],
  ["settings-service", 4007],
  ["subscription-service", 4008],
  ["payment-service", 4009],
];

async function waitFor(name, port) {
  const url = `http://127.0.0.1:${port}/health`;
  let lastError;
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      console.log(`OK ${name} (${port})`, data.status || "UP");
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  throw new Error(`${name} indisponible sur ${url}: ${lastError?.message}`);
}

await Promise.all(services.map(([name, port]) => waitFor(name, port)));
console.log("Tous les services essentiels répondent.");
