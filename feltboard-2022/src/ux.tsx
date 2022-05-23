import React, { useState, useEffect } from 'react';
import { IAzureAudience } from '@fluidframework/azure-client';
import { IFluidContainer, SharedMap } from 'fluid-framework';
import { FeltShape } from '.';
import Icon from '@mdi/react';
import { mdiCircle } from '@mdi/js';
import { mdiSquare } from '@mdi/js';
import { mdiTriangle } from '@mdi/js';
import { mdiRectangle } from '@mdi/js';
import { Color, Shape as S } from './util';

// eslint-disable-next-line react/prop-types
export function ReactApp(props: {
    container: IFluidContainer;
    audience: IAzureAudience;
    shapes: Map<string, FeltShape>;
    createShape: any;
}): JSX.Element {
    return (
        <div>
            <Toolbar {...props} />
            <Canvas />
            <Instructions />
        </div>
    );
}

// eslint-disable-next-line react/prop-types
export function Toolbar(props: {
    createShape: any;
    container: IFluidContainer;
    audience: IAzureAudience;
}) {
    const test = mdiCircle;

    return (
        <div className="navbar is-light">
            <div className="navbar-menu">
                <div className="navbar-start">
                    <div className="navbar-item">
                        <div className="field is-grouped">
                            <ShapeButton
                                icon={mdiCircle}
                                title="Circle"
                                color="red"
                                createFunction={() =>
                                    props.createShape(S.Circle, Color.Red)
                                }
                            />
                            <ShapeButton
                                icon={mdiSquare}
                                title="Square"
                                color="blue"
                                createFunction={() =>
                                    props.createShape(S.Square, Color.Blue)
                                }
                            />
                            <ShapeButton
                                icon={mdiTriangle}
                                title="Triangle"
                                color="orange"
                                createFunction={() =>
                                    props.createShape(S.Triangle, Color.Orange)
                                }
                            />
                            <ShapeButton
                                icon={mdiRectangle}
                                title="Rectangle"
                                color="purple"
                                createFunction={() =>
                                    props.createShape(S.Rectangle, Color.Purple)
                                }
                            />
                        </div>
                    </div>
                </div>
                <div className="navbar-end">
                    <div className="navbar-item">
                        <div className="field is-grouped">
                            <Audience
                                container={props.container}
                                audience={props.audience}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ShapeButton(props: {
    icon: any;
    title: string;
    color: string;
    createFunction: any;
}) {
    return (
        <p className="control">
            <button
                className="button is-large is-white"
                onClick={props.createFunction}
            >
                <span className="icon">
                    <Icon
                        path={props.icon}
                        title={props.title}
                        size={2}
                        color={props.color}
                    />
                </span>
            </button>
        </p>
    );
}

export function Canvas() {
    return <div id="canvas"></div>;
}

export function Instructions() {
    return (
        <footer className="footer">
            <div className="content">
                <p>
                    Share the URL incuding the goo at the end to make a picture with
                    some friends.
                </p>
                <p>Right-click to change the color of a shape.</p>
                <p>You can make a lot of shapes but you can't delete them.</p>
            </div>
        </footer>
    );
}

export function Audience(props: {
    container: IFluidContainer;
    audience: IAzureAudience;
}): JSX.Element {
    const { container, audience } = props;
    // retrieve all the members currently in the session
    const [members, setMembers] = React.useState(
        Array.from(audience.getMembers().values())
    );

    const myself = audience.getMyself();
    const setMembersCallback = React.useCallback(
        () => setMembers(Array.from(audience.getMembers().values())),
        [setMembers, audience]
    );

    // Setup a listener to update our users when new clients join the session
    React.useEffect(() => {
        container.on('connected', setMembersCallback);
        audience.on('membersChanged', setMembersCallback);
        return () => {
            container.off('connected', () => setMembersCallback);
            audience.off('membersChanged', () => setMembersCallback);
        };
    }, [container, audience, setMembersCallback]);

    let memberDisplay: JSX.Element[];
    if (members.length > 3) {
        const membersToShow = members;
        memberDisplay = membersToShow.map((v, k) => (
            <li key={k.toString()}>
                {v.userName} ({v.userId})
            </li>
        ));
    } else {
        memberDisplay = members.map((v, k) => (
            <li key={k.toString()}>
                {v.userName} ({v.userId})
            </li>
        ));
    }

    return (
        <p className="control">
            <button className="button is-large is-white">{members.length}</button>
        </p>
    );
}
