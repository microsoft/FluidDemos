import {
    AzureFunctionTokenProvider,
    AzureClient,
    AzureConnectionConfig,
    AzureContainerServices,
    LOCAL_MODE_TENANT_ID,
} from '@fluidframework/azure-client';
import {
    generateTestUser,
    InsecureTokenProvider,
} from '@fluidframework/test-client-utils';
import {
    ContainerSchema,
    IFluidContainer,
    SharedMap,
} from 'fluid-framework';

// Define the server (Azure or local) we will be using
const useAzure = process.env.FLUID_CLIENT === 'azure';
if (!useAzure) {
    console.warn(`Configured to use local tinylicious.`);
}

const user = generateTestUser();

const azureUser = {
    userId: user.id,
    userName: user.name,
};

const connectionConfig: AzureConnectionConfig = useAzure
    ? {
          tenantId: process.env.AZURE_TENANT_ID ?? LOCAL_MODE_TENANT_ID,
          tokenProvider: new AzureFunctionTokenProvider(
              process.env.AZURE_FUNCTION_TOKEN_PROVIDER_URL!,
              azureUser
          ),
          orderer: process.env.AZURE_ORDERER ?? 'http://localhost:7070',
          storage: process.env.AZURE_STORAGE ?? 'http://localhost:7070',
      }
    : {
          tenantId: LOCAL_MODE_TENANT_ID,
          tokenProvider: new InsecureTokenProvider('VALUE_NOT_USED', user),
          orderer: 'http://localhost:7070',
          storage: 'http://localhost:7070',
      };

const clientProps = {
    connection: connectionConfig,
};

const client = new AzureClient(clientProps);

// Define the schema of our Container. This includes the DDSes/DataObjects
// that we want to create dynamically and any
// initial DataObjects we want created when the container is first created.
const containerSchema: ContainerSchema = {
    initialObjects: {
        shapes: SharedMap,
    },
    dynamicObjectTypes: [SharedMap],
};

async function initializeNewContainer(container: IFluidContainer): Promise<void> {
    // We don't have any additional configuration to do here. If we needed to initialize
    // some of our Fluid data, we could do so here.
}

/**
 * This function will create a container if no container ID is passed on the hash portion of the URL.
 * If a container ID is provided, it will load the container.
 *
 * @returns The loaded container and container services.
 */
export const loadFluidData = async (): Promise<{
    container: IFluidContainer;
    services: AzureContainerServices;
}> => {
    let container: IFluidContainer;
    let services: AzureContainerServices;
    let id: string;

    // Get or create the document depending if we are running through the create new flow
    const createNew = location.hash.length === 0;
    if (createNew) {
        // The client will create a new detached container using the schema
        // A detached container will enable the app to modify the container before attaching it to the client
        ({ container, services } = await client.createContainer(containerSchema));

        // Initialize our Fluid data -- set default values, establish relationships, etc.
        await initializeNewContainer(container);

        // If the app is in a `createNew` state, and the container is detached, we attach the container.
        // This uploads the container to the service and connects to the collaboration session.
        id = await container.attach();
        // The newly attached container is given a unique ID that can be used to access the container in another session
        location.hash = id;
    } else {
        id = location.hash.substring(1);
        // Use the unique container ID to fetch the container created earlier.  It will already be connected to the
        // collaboration session.
        ({ container, services } = await client.getContainer(id, containerSchema));
    }

    return { container, services };
};
