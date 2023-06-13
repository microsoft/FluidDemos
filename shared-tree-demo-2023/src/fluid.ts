import {
    AzureClient,
    AzureRemoteConnectionConfig,
    AzureLocalConnectionConfig,
    AzureContainerServices,
    AzureClientProps,
    AzureMember,
    ITokenProvider,
    ITokenResponse,
} from '@fluidframework/azure-client';
import {
    generateTestUser,
    InsecureTokenProvider,
} from '@fluidframework/test-client-utils';
import { ContainerSchema, IFluidContainer } from 'fluid-framework';
import {
    GlobalFieldSchema,
    ISharedTree,
    SchematizeConfiguration,
    SharedTreeFactory,
} from '@fluid-experimental/tree2';

import axios from 'axios';
import React from 'react';
import { App } from './schema';
import { DevtoolsLogger, initializeDevtools } from '@fluid-experimental/devtools';
import { TelemetryNullLogger } from '@fluidframework/telemetry-utils';

/**
 * Token Provider implementation for connecting to an Azure Function endpoint for
 * Azure Fluid Relay token resolution.
 */
export class AzureFunctionTokenProvider implements ITokenProvider {
    /**
     * Creates a new instance using configuration parameters.
     * @param azFunctionUrl - URL to Azure Function endpoint
     * @param user - User object
     */
    constructor(
        private readonly azFunctionUrl: string,
        private readonly user?: Pick<
            AzureMember,
            'userId' | 'userName' | 'additionalDetails'
        >
    ) {}

    public async fetchOrdererToken(
        tenantId: string,
        documentId?: string
    ): Promise<ITokenResponse> {
        return {
            jwt: await this.getToken(tenantId, documentId),
        };
    }

    public async fetchStorageToken(
        tenantId: string,
        documentId: string
    ): Promise<ITokenResponse> {
        return {
            jwt: await this.getToken(tenantId, documentId),
        };
    }

    private async getToken(
        tenantId: string,
        documentId: string | undefined
    ): Promise<string> {
        const response = await axios.get(this.azFunctionUrl, {
            params: {
                tenantId,
                documentId,
                userId: this.user?.userId,
                userName: this.user?.userName,
                additionalDetails: this.user?.additionalDetails,
            },
        });
        return response.data as string;
    }
}

export class MySharedTree {
    public static getFactory(): SharedTreeFactory {
        return new SharedTreeFactory();
    }
}

// Define the server (Azure or local) we will be using
const useAzure = process.env.FLUID_CLIENT === 'azure';
if (!useAzure) {
    console.warn(`Configured to use local tinylicious.`);
}

const user = generateTestUser();

export const azureUser = {
    userId: user.id,
    userName: user.name,
};

const remoteConnectionConfig: AzureRemoteConnectionConfig = {
    type: 'remote',
    tenantId: process.env.AZURE_TENANT_ID!,
    tokenProvider: new AzureFunctionTokenProvider(
        process.env.AZURE_FUNCTION_TOKEN_PROVIDER_URL!,
        azureUser
    ),
    endpoint: process.env.AZURE_ORDERER!,
};

const localConnectionConfig: AzureLocalConnectionConfig = {
    type: 'local',
    tokenProvider: new InsecureTokenProvider('VALUE_NOT_USED', user),
    endpoint: 'http://localhost:7070',
};

const connectionConfig: AzureRemoteConnectionConfig | AzureLocalConnectionConfig =
    useAzure ? remoteConnectionConfig : localConnectionConfig;

const baseLogger = new TelemetryNullLogger();
const devtoolsLogger = new DevtoolsLogger(baseLogger);

const clientProps: AzureClientProps = {
    connection: connectionConfig,
    logger: devtoolsLogger
};

const client = new AzureClient(clientProps);

// Define the schema of our Container. This includes the DDSes/DataObjects
// that we want to create dynamically and any
// initial DataObjects we want created when the container is first created.
const containerSchema: ContainerSchema = {
    initialObjects: {
        tree: MySharedTree,
    },
};

async function initializeNewContainer<TRoot extends GlobalFieldSchema>(
    container: IFluidContainer,
    config: SchematizeConfiguration<TRoot>
): Promise<void> {
    const fluidTree = container.initialObjects.tree as ISharedTree;
    fluidTree.schematize(config);
}

/**
 * This function will create a container if no container ID is passed on the hash portion of the URL.
 * If a container ID is provided, it will load the container.
 *
 * @returns The loaded container and container services.
 */
export const loadFluidData = async <TRoot extends GlobalFieldSchema>(
    config: SchematizeConfiguration<TRoot>
): Promise<{
    data: SharedTree<App>;
    services: AzureContainerServices;
    container: IFluidContainer;
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
        await initializeNewContainer(container, config);

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

    const tree = container.initialObjects.tree as ISharedTree;
    const data = new SharedTree<App>(tree, tree.root as any);

    initializeDevtools({
        logger: devtoolsLogger,
        initialContainers: [
            {
                container,
                containerKey: 'Shared Tree Demo Container'
            },
        ],
    });

    return { data, services, container };
};

const treeSym = Symbol();

// The useTree React hook makes building the user interface very
// intuitive as it allows the developer to use typed tree data to build the UI
// and it ensures that any changes trigger an update to the React app.
export function useTree<TRoot>(tree: SharedTree<TRoot>): TRoot {
    // This proof-of-concept implementation allocates a state variable this is modified
    // when the tree changes to trigger re-render.
    const [invalidations, setInvalidations] = React.useState(0);

    // Register for tree deltas when the component mounts
    React.useEffect(() => {
        // Returns the cleanup function to be invoked when the component unmounts.
        return tree[treeSym].events.on('afterBatch', () => {
            setInvalidations(invalidations + Math.random());
        });
    });

    return tree[treeSym].root as unknown as TRoot;
}

export class SharedTree<T> {
    constructor(private readonly tree: ISharedTree, public readonly root: T) {}

    public get [treeSym]() {
        return this.tree;
    }
}
