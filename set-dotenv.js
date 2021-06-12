const fs = require('fs');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const project = process.env.CLOUDSDK_CORE_PROJECT;
const stage = process.env.STAGE;

const availableStages = ['dev', 'staging', 'production'];

async function fetchSecret(secretName) {
  const name = `projects/${project}/secrets/${secretName}/versions/latest`;

  const client = new SecretManagerServiceClient();
  const [version] = await client.accessSecretVersion({
    name,
  });

  const payload = version.payload.data.toString();
  if (!payload) throw new Error(`Could not fetch ${secretName}`);
  return payload;
}

async function writeDotenv(secretName, fileName = '.env') {
  fs.writeFileSync(fileName, await fetchSecret(secretName));
}

async function main() {
  if (!project) {
    throw new Error('CLOUDSDK_CORE_PROJECT is not defined');
  }

  if (!stage) {
    throw new Error('STAGE is not defined');
  } else if (!availableStages.includes(stage)) {
    throw new Error(`STAGE "${stage}" is not in available`);
  }

  await writeDotenv(`${stage}-dotenv`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
