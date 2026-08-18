const { spawn } = require("node:child_process");
const path = require("node:path");

const requiredVariables = [
  "DATABASE_URL",
  "MONGO_URI",
  "JWT_SECRET",
  "INTERNAL_SERVICE_SECRET"
];

const missingVariables = requiredVariables.filter(name => !process.env[name]);

if (missingVariables.length) {
  console.error(`Variables obligatoires manquantes : ${missingVariables.join(", ")}`);
  process.exit(1);
}

const databaseUrl = new URL(process.env.DATABASE_URL);
const sharedEnvironment = {
  ...process.env,
  NODE_ENV: "production",
  DB_HOST: databaseUrl.hostname,
  DB_PORT: databaseUrl.port || "5432",
  DB_NAME: databaseUrl.pathname.replace(/^\//, ""),
  DB_USER: decodeURIComponent(databaseUrl.username),
  DB_PASSWORD: decodeURIComponent(databaseUrl.password)
};

const services = [
  ["auth-service", "4001"],
  ["user-service", "4002"],
  ["course-service", "4003"],
  ["progress-service", "4004"],
  ["recommendation-service", "4005"],
  ["interaction-service", "4006"],
  ["settings-service", "4007"],
  ["subscription-service", "4008"],
  ["payment-service", "4009"]
];

const localUrls = {
  AUTH_SERVICE_URL: "http://127.0.0.1:4001",
  USER_SERVICE_URL: "http://127.0.0.1:4002",
  COURSE_SERVICE_URL: "http://127.0.0.1:4003",
  PROGRESS_SERVICE_URL: "http://127.0.0.1:4004",
  RECOMMENDATION_SERVICE_URL: "http://127.0.0.1:4005",
  INTERACTION_SERVICE_URL: "http://127.0.0.1:4006",
  SETTINGS_SERVICE_URL: "http://127.0.0.1:4007",
  SUBSCRIPTION_SERVICE_URL: "http://127.0.0.1:4008",
  PAYMENT_SERVICE_URL: "http://127.0.0.1:4009"
};

const children = [];
let stopping = false;

function launch(name, port, additionalEnvironment = {}) {
  const child = spawn("node", ["src/server.js"], {
    cwd: path.join("/app", name),
    env: {
      ...sharedEnvironment,
      ...additionalEnvironment,
      PORT: port
    },
    stdio: "inherit"
  });

  children.push(child);
  child.on("exit", code => {
    if (!stopping) {
      console.error(`${name} s'est arrêté avec le code ${code}.`);
      stop(code || 1);
    }
  });
}

function stop(exitCode = 0) {
  if (stopping) {
    return;
  }

  stopping = true;
  for (const child of children) {
    child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(exitCode), 1000).unref();
}

for (const [name, port] of services) {
  const entryFile = ["settings-service", "subscription-service", "payment-service"].includes(name)
    ? "src/index.js"
    : "src/server.js";
  const child = spawn("node", [entryFile], {
    cwd: path.join("/app", name),
    env: {
      ...sharedEnvironment,
      ...localUrls,
      PORT: port
    },
    stdio: "inherit"
  });

  children.push(child);
  child.on("exit", code => {
    if (!stopping) {
      console.error(`${name} s'est arrêté avec le code ${code}.`);
      stop(code || 1);
    }
  });
}

launch("api-gateway", process.env.PORT || "10000", localUrls);

process.on("SIGTERM", () => stop(0));
process.on("SIGINT", () => stop(0));
