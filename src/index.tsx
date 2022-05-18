import { SharedMap } from 'fluid-framework';
import * as PIXI from 'pixi.js';
import React from 'react';
import ReactDOM from 'react-dom';
import { loadFluidData } from './fluid';
import {
    Color,
    getNextColor,
    Shape,
} from './util';
import {
    Pixi2Fluid,
    FluidDisplayObject,
    Fluid2Pixi
} from './wrappers';
import * as UX from './ux';
import { Guid } from 'guid-typescript';

import './styles.scss';

async function main() {

    // create the root element for React
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);

    // disable right-click context menu since right-click changes shape color
    document.addEventListener('contextmenu', (event) => event.preventDefault());

    // set some constants for shapes
    const shapeLimit = 999;
    const size = 60;

    // Initialize Fluid
    const { container, services } = await loadFluidData();
    const audience = services.audience;

    // create PIXI app
    const pixiApp = await initPixiApp();

    // create local map for shapes - contains customized PIXI objects
    const localMap = new Map<string, FeltShape>();

    // create Fluid map for shapes - contains only the data that needs to be
    // synched between clients
    const fluidMap = container.initialObjects.shapes as SharedMap;

    // This function will be called each time a shape is moved around the canvas.
    // It's passed in to the CreateShape function which wires it up to the
    // PIXI events for the shape.
    const setFluidPosition = (dobj: FeltShape) => {
        const fobj = Pixi2Fluid(dobj);
        // Store the position in Fluid
        fluidMap.set(dobj.id, fobj);
    };

    const addNewLocalShape = (
        shape: Shape,
        color: Color,
        id: string,
        x: number,
        y: number
    ): FeltShape => {
        const fs = new FeltShape(
            pixiApp,
            shape,
            color,
            size,
            id, // id
            x, // x
            y, // y
            setFluidPosition // function that syncs local data with Fluid
        );

        localMap.set(id, fs); // add the new shape to local data
        pixiApp.stage.addChild(fs); // add the new shape to the PIXI canvas

        return fs;
    };

    // adds a new shape
    const addNewShape = (
        shape: Shape,
        color: Color,
        id: string,
        x: number,
        y: number
    ) => {
        const fs = addNewLocalShape(shape, color, id, x, y);
        setFluidPosition(fs);
    };

    // get the Fluid shapes that already exist
    fluidMap.forEach((fdo: FluidDisplayObject, id: string) => {
         // add the Fluid shapes to the local shape data
        addNewLocalShape(fdo.shape, fdo.color, fdo.id, fdo.x, fdo.y);
    });

    // function passed into React UX for creating shapes
    const createShape = (shape: Shape, color: Color) => {
        if (fluidMap.size < shapeLimit) {
            addNewShape(shape, color, Guid.create().toString(), 100, 100);
        }
    };

    // event handler for detecting remote changes to Fluid data and updating
    // the local data
    fluidMap.on('valueChanged', (changed, local, target) => {
        if (!local) {
            const remoteShape = target.get(changed.key) as FluidDisplayObject;
            const localShape = localMap.get(changed.key);
            if (localShape) {
                Fluid2Pixi(localShape, remoteShape);
            } else {
                console.log('Creating shape from Fluid');
                addNewLocalShape(
                    remoteShape.shape,
                    remoteShape.color,
                    remoteShape.id,
                    remoteShape.x,
                    remoteShape.y
                );
            }
        }
    });

    // initialize the React UX
    ReactDOM.render(
        <UX.ReactApp
            container={container}
            audience={audience}
            shapes={localMap}
            createShape={createShape}
        />,
        document.getElementById('root')
    );

    // insert the PIXI canvas in the page
    document.getElementById('canvas')?.appendChild(pixiApp.view);
}

// initialize the PIXI app
async function initPixiApp() {
    const app = new PIXI.Application({ width: 610, height: 545 });
    app.stage.sortableChildren = true;

    return app;
}

// wrapper class for a PIXI shape with a few extra methods and properties
// for creating and managing shapes
export class FeltShape extends PIXI.Graphics {
    id = '';
    dragging = false;
    private _color: Color = Color.Red;
    z = 0;
    readonly shape: Shape = Shape.Circle;
    readonly size: number = 90;

    constructor(
        app: PIXI.Application,
        shape: Shape,
        color: Color,
        size: number,
        id: string,
        x: number,
        y: number,
        setFluidPosition: (dobj: FeltShape) => void
    ) {
        super();
        this.id = id;
        this.shape = shape;
        this.size = size;

        this.beginFill(0xffffff);

        this.setShape();

        this.endFill();
        console.log(`initializing color to: ${color}`);
        this.color = color;

        this.interactive = true;
        this.buttonMode = true;
        this.x = x;
        this.y = y;

        // event handlers for interaction with PIXI shapes
        const onRightClick = (event: any) => {
            this.color = getNextColor(this.color);
            this.dragging = false;
            setFluidPosition(this); // syncs local changes with Fluid data
        };

        const onDragStart = (event: any) => {
            if (event.data.buttons === 1) {
                this.alpha = 0.5;
                this.zIndex = 9999;
                this.dragging = true;
                setFluidPosition(this); // syncs local changes with Fluid data
            }
        };

        const onDragEnd = (event: any) => {
            if (this.dragging) {
                this.alpha = 1;
                this.zIndex = this.z;
                this.dragging = false;
                setFluidPosition(this); // syncs local changes with Fluid data
            }
        };

        const onDragMove = (event: any) => {
            if (this.dragging) {
                this.alpha = 0.5;
                this.zIndex = 9999;
                updatePosition(event.data.global.x, event.data.global.y);
                setFluidPosition(this); // syncs local changes with Fluid data
            }
        };

        // sets local postion and enforces canvas boundary
        const updatePosition = (x: number, y: number) => {
            if (x >= this.width / 2 && x <= app.renderer.width - this.width / 2) {
                this.x = x;
            }

            if (y >= this.height / 2 && y <= app.renderer.height - this.height / 2) {
                this.y = y;
            }
        };

        // intialize event handlers
        this.on('pointerdown', onDragStart)
            .on('pointerup', onDragEnd)
            .on('pointerupoutside', onDragEnd)
            .on('pointermove', onDragMove)
            .on('rightclick', onRightClick);
    }

    set color(color: Color) {
        this._color = color;
        this.tint = Number(color);
    }

    get color() {
        return this._color;
    }

    private setShape() {
        switch (this.shape) {
            case Shape.Circle:
                this.drawCircle(0, 0, this.size / 2);
                break;
            case Shape.Square:
                this.drawRect(-this.size / 2, -this.size / 2, this.size, this.size);
                break;
            case Shape.Triangle:
                // eslint-disable-next-line no-case-declarations
                const path = [
                    0,
                    -(this.size / 2),
                    -(this.size / 2),
                    this.size / 2,
                    this.size / 2,
                    this.size / 2,
                ];
                this.drawPolygon(path);
                break;
            case Shape.Rectangle:
                this.drawRect(
                    (-this.size * 1.5) / 2,
                    -this.size / 2,
                    this.size * 1.5,
                    this.size
                );
                break;
            default:
                this.drawCircle(0, 0, this.size);
                break;
        }
    }
}

export default main();
