export enum Shape {
    Circle = 'CIRCLE',
    Square = 'SQUARE',
    Triangle = 'TRIANGLE',
    Rectangle = 'RECTANGLE',
}

export enum Color {
    Red = '0xFF0000',
    Green = '0x009A44',
    Blue = '0x0000FF',
    Orange = '0xFF7F00',
    Purple = '0x800080',
}

export function getNextColor(current: Color) {
    const currentIndex = Object.values(Color).indexOf(current);
    return getDeterministicColor(currentIndex + 1);
}

export function getDeterministicColor(index: number): Color {
    return Object.values(Color)[index % Object.values(Color).length];
}
