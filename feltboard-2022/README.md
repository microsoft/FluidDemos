# Fluid Framework Felt Board

Feltboard is an example application that uses Fluid Framework to enable collaboration.

The app is a virtual [felt board](https://en.wikipedia.org/wiki/Felt#Arts_and_crafts) with pieces that can be moved
around the board. Everyone can move pieces.

## Building and running

This app will only work when connected to a Fluid relay service. For isolated local development, you can run a local instance of the azure service by running:

npx @fluidframework/azure-local-service@latest

Running npm run dev will automatically connect to that local service.

If you want to run your local code against Fluid relay service in Azure, go to (https://aka.ms/fluidrelayservice) to set up the service. Use the information from your Azure Fluid Relay instance to create a .env file with the following config:

AZURE_TENANT_ID={id}

AZURE_ORDERER={url}

AZURE_STORAGE={url}

AZURE_FUNCTION_TOKEN_PROVIDER_URL={url}

FLUID_CLIENT=azure

Place the .env file at the root of your project. It is not recommended that you include your .env in your source code.

You can use the following npm scripts (`npm run SCRIPT-NAME`) to build and run the app.

<!-- AUTO-GENERATED-CONTENT:START (SCRIPTS) -->
| Script | Description |
|--------|-------------|
| `build` | `npm run format && npm run docs && npm run compile && npm run pack` |
| `compile` | Compile the TyppeScript source code to JavaScript. |
| `dev` | Runs the app in webpack-dev-server. Expects local-azure-service running on port 7070. |
| `dev:azure` | Runs the app in webpack-dev-server using the Azure Fluid Relay config. |
| `docs` | Update documentation. |
| `format` | Format source code using Prettier. |
| `lint` | Lint source code using ESLint |
| `pack` | `webpack` |
| `start` | `npm run dev` |
<!-- AUTO-GENERATED-CONTENT:END -->
