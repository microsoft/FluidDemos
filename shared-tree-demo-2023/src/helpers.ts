import {    
    parentField,
} from '@fluid-experimental/tree2';
import { App, Note, Pile } from './schema';
import { Guid } from 'guid-typescript';

// Takes a destination pile, content string, and author data and adds a new
// note to the SharedTree with that data.
export function addNote(
    pile: Pile,
    text: string,
    author: { name: string; id: string }
) {
    const timeStamp = new Date().getTime();
    
    // Define the note to add to the SharedTree - this must conform to
    // the schema definition of a note
    const note = {
        id: Guid.create().toString(),
        text,
        author,
        votes: [],
        created: timeStamp,
        lastChanged: timeStamp        
    };

    // Insert the note into the SharedTree. This code always inserts the note at the end of the
    // notes sequence in the provided pile object. As this function can operate on multiple items
    // in the tree, the note is passed as an array.
    pile.notes.insertNodes(pile.notes.length, [note]);
}

// Update the note text and also update the timestamp in the note
export function updateNoteText(note: Note, text: string) {
    note.lastChanged = new Date().getTime();
    note.text = text;
}

// Move a note from one position in a sequence to another position in the same sequence or
// in a different sequence. The index being passed here is the desired index after the move.
export function moveNote(note: Note, sourcePile: Pile, index: number, destinationPile: Pile) {
    // need to test that sourcePile and destinationPile haven't been deleted
    // because the move may have been initiated through a drag and drop which
    // is asynchronous - the state may have changed during the drag but this function
    // is operating based on the state at the moment the drag began
    if (sourcePile.notes[note[parentField].index] !== note) return;

    // The parentField symbol gives us access to the current index of the item.
    // The getAdjustedIndex call here is dealing with a quirk of the way SharedTree
    // indexes work.
    sourcePile.notes.moveNodes(
        note[parentField].index,
        1,
        getAdjustedIndex(note, sourcePile, index, destinationPile),
        destinationPile.notes
    )
}

// Add a new pile (container for notes) to the SharedTree.
export function addPile(app: App, name: string):Pile {
    const pile = {
        id: Guid.create().toString(),
        name,
        notes: [],
    };

    const index = app.piles.length

    app.piles.insertNodes(index, [pile]);
    return app.piles[index];
}

// Function that wraps the moveNote function to keep the UI code simple.
export function moveNoteToNewPile(note: Note, sourcePile: Pile, app: App, name: string) {
    const newPile = addPile(app, name);
    moveNote(note, sourcePile, newPile.notes.length, newPile);
}

// Function that deletes a pile and moves the notes in that pile
// to the default pile instead of deleting them as well
export function deletePile(pile: Pile, app: App): boolean {
    // Prevent deleting the default pile
    if (pile[parentField].index == 0) {return false}

    // Test for the presence of notes and move them to the default pile
    if (pile.notes.length !== 0) {        
        const defaultPile = app.piles[0];        
        pile.notes.moveNodes(0, pile.notes.length, defaultPile.notes.length, defaultPile.notes);       
    }

    // Delete the now empty pile
    app.piles.deleteNodes(pile[parentField].index, 1);
    return true;    
}

// Function to delete a note. This function tests to make sure the note is still in the
// specified pile before attempting the delete.
export function deleteNote(note: Note, pile: Pile) {
    if (pile.notes[note[parentField].index] !== note) return;
    pile.notes.deleteNodes(note[parentField].index, 1);
}

// This function accounts for an issue where the target index of a move will vary
// depending on whether the node is moved within a sequence vs. to another
// sequence and whether the node is before the target index in the sequence.
// This is awkward and will be fixed in a future iteration of the API.
function getAdjustedIndex(note: Note, sourcePile: Pile, targetIndex: number, destinationPile: Pile): number {
    if ((sourcePile === destinationPile) && (note[parentField].index < targetIndex)) {
        return targetIndex - 1;
    } else {
        return targetIndex;
    }
}

export function isVoter(note: Note, user: { name: string; id: string }) {
    for (const u of note.votes) {
        if (u.id == user.id) {
            return u;
        }
    }
    return undefined;
}

export function toggleVote(note: Note, user: { name: string; id: string }) {
    const voter = isVoter(note, user);
    if (voter) {
        note.votes.deleteNodes(voter[parentField].index, 1);
        note.lastChanged = new Date().getTime();
    } else {
        note.votes.insertNodes(note.votes.length, [user]);
        note.lastChanged = new Date().getTime();
    }
}

export function getRotation(note: Note) {
    const i = hashCode(note.id);

    const rotationArray = [
        'rotate-1',
        '-rotate-2',
        'rotate-2',
        '-rotate-1',
        '-rotate-3',
        'rotate-3',
    ];

    return rotationArray[i % rotationArray.length];
}

export function hashCode(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = 31 * h + str.charCodeAt(i);
    }
    return h;
}
