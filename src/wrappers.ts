import { FeltShape } from '.';
import { Color, Shape } from './util';

export interface FluidDisplayObject {
    id: string;
    x: number;
    y: number;
    alpha: number;
    color: Color;
    z: number;
    dragging: boolean;
    shape: Shape;
}

export const Pixi2Fluid = (dobj: FeltShape): FluidDisplayObject => {
    return {
        id: dobj.id,
        x: dobj.x,
        y: dobj.y,
        alpha: dobj.alpha,
        color: dobj.color,
        z: dobj.zIndex,
        dragging: dobj.dragging,
        shape: dobj.shape,
    };
};

export const Fluid2Pixi = (
    shapeToUpdate: FeltShape,
    sourceObject: FluidDisplayObject
) => {
    shapeToUpdate.x = sourceObject.x;
    shapeToUpdate.y = sourceObject.y;
    shapeToUpdate.alpha = sourceObject.alpha;
    shapeToUpdate.zIndex = sourceObject.z;
    shapeToUpdate.color = sourceObject.color;
    return shapeToUpdate;
};
