/* eslint-disable react/jsx-key */
import React from 'react';
import ReactDOM from 'react-dom';
import { loadFluidData } from './fluid';
import { AllowedUpdateType } from '@fluid-experimental/tree2';
import { App } from './ux';
import { schema } from './schema';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

async function main() {
    // create the root element for React
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);

    const { data, services, container } = await loadFluidData({
        schema,
        initialTree: {
            piles: [
                {
                    id: '7301d9fc-f7ff-11ed-b67e-0242ac120002',
                    name: 'Ideas...',
                    notes: [],
                },
            ],
        },
        allowedSchemaModifications: AllowedUpdateType.SchemaCompatible,
    });    

    ReactDOM.render(
        [
            <DndProvider backend={HTML5Backend}>
                <App data={data} services={services} container={container} />
            </DndProvider>
        ],
        document.getElementById('root')
    );
}

export default main();
