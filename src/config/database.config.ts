import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

interface DatabaseCredentials {
  username: string;
  password: string;
  host: string;
  port: number;
  database: string;
}

export async function getDatabaseCredentials(): Promise<DatabaseCredentials> {
    const secretArn = process.env.DB_SECRET_ARN;

    try {
        if (!secretArn) {
            throw new Error(`Secret ARN not found in env variables`);
        }

        const client = new SecretsManagerClient({
            region: process.env.AWS_REGION || 'us-west-1',
        });

        const command = new GetSecretValueCommand({ SecretId: secretArn });

        const response = await client.send(command);

        if (!response.SecretString) {
            throw new Error('Secret string not found');
        }

        const secret = JSON.parse(response.SecretString);

        return {
            username: secret.username,
            password: secret.password,
            host: secret.host,
            port: secret.port,
            database: secret.dbname || secret.database,
        };
    } catch (error) {
        console.error('Error retrieving database credentials from Secrets Manager', error);
        throw new Error(`Failed to retrieve database credentials: ${error.message}`);
    }
}
