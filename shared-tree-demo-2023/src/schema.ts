import {
    FieldKinds,
    SchemaAware,
    SchemaBuilder,
    ValueSchema,
} from '@fluid-experimental/tree2';

// Schema is defined using a builder object that generates a schema that is passed into the
// SharedTree data structure when it is intialized. The following code
// defines a set of types, both primitives and user-defined, that are used to
// build the schema and, in the case of user-defined types, can be exported
// as TypeScript types to make it easier to write the app in a type-safe manner.

// Include a UUID to guarantee that this schema will be unique
const builder = new SchemaBuilder('fc1db2e8-0a00-11ee-be56-0242ac120002');

// Define the primitive this app uses
export const float64 = builder.primitive('number', ValueSchema.Number);
export const string = builder.primitive('string', ValueSchema.String);

// Define a simple user type - in most apps this would probably not be
// necessary as the user would be defined through an identity/auth service
export const userSchema = builder.object('demo:user', {
    local: {
        name: SchemaBuilder.field(FieldKinds.value, string),
        id: SchemaBuilder.field(FieldKinds.value, string),
    },
});

// Define the schema for the note object. This schema includes an id to make
// building the React app simpler, several fields that use primitive types, and a sequence
// of users (defined above) to track which users have voted on this note.
export const noteSchema = builder.object('demo:note', {
    local: {
        id: SchemaBuilder.field(FieldKinds.value, string),
        text: SchemaBuilder.field(FieldKinds.value, string),
        author: SchemaBuilder.field(FieldKinds.value, userSchema),
        votes: SchemaBuilder.field(FieldKinds.sequence, userSchema),
        created: SchemaBuilder.field(FieldKinds.value, float64),
        lastChanged: SchemaBuilder.field(FieldKinds.value, float64)        
    },
});

// Define the schema for the container of notes. This type includes a sequence of notes.
export const pileSchema = builder.object('demo:pile', {
    local: {
        id: SchemaBuilder.field(FieldKinds.value, string),
        name: SchemaBuilder.field(FieldKinds.value, string),
        notes: SchemaBuilder.field(FieldKinds.sequence, noteSchema),
    },
});

// Define a root type. This only contains a sequence of piles but if the app needed
// additional metadata or other app data, it is easy to add that here.
export const appSchema = builder.object('demo:app', {
    local: {
        piles: SchemaBuilder.field(FieldKinds.sequence, pileSchema),
    },
});

// Define the root of the schema as the app type.
export const rootField = SchemaBuilder.field(FieldKinds.value, appSchema);

// Create the schema object to pass into the SharedTree
export const schema = builder.intoDocumentSchema(rootField);

// Export the types defined here as TypeScript types.
export type App = SchemaAware.TypedNode<typeof appSchema>;
export type Pile = SchemaAware.TypedNode<typeof pileSchema>;
export type Note = SchemaAware.TypedNode<typeof noteSchema>;
export type User = SchemaAware.TypedNode<typeof userSchema>;
