const fs = require('fs');

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

if (!process.env.CLOUDSDK_CORE_PROJECT) {
  console.error('CLOUDSDK_CORE_PROJECT is not defined');
  process.exit(1);
}

const project = process.env.CLOUDSDK_CORE_PROJECT;
const stage = process.env.STAGE;

const client = new SecretManagerServiceClient();

async function fetchSecret(secretName) {
  const name = `projects/${project}/secrets/${secretName}/versions/latest`;

  const [version] = await client.accessSecretVersion({
    name,
  });

  const payload = version.payload.data.toString();
  if (!payload) throw new Error(`Could not fetch ${secretName}`);
  return payload;
}

async function downloadEnvironmentVariables(secretName, fileName = '.env') {
  fs.writeFileSync(fileName, await fetchSecret(secretName));
}

async function main() {
  const availableStages = ['dev', 'staging', 'production'];
  if (!stage) {
    throw new Error('STAGE is not defined');
  } else if (!availableStages.includes(stage)) {
    throw new Error(`STAGE "${stage}" is not in available`);
  }

  await downloadEnvironmentVariables(`${stage}-dotenv`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
