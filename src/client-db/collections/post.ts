import { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxDocument, RxJsonSchema, toTypedRxJsonSchema } from "rxdb";

export const postSchemaLiteral = {
  version: 0,
  title: 'post schema with indexes',
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100 // <- the primary key must have set maxLength
    },
    title: {
      type: 'string',
      maxLength: 100 // <- string-fields that are used as an index, must have set maxLength.
    },
    content: {
      type: 'string',
      maxLength: 1000
    },
    userId: {
      type: 'string',
      maxLength: 100
    },
    createAt: {
      type: 'string',
      format: 'date-time'
    }
  },
  required: [
    'id',
    'title',
    'content',
    'createAt'
  ],
  indexes: [
    'userId'
  ]
} as const 



const schemaTyped = toTypedRxJsonSchema(postSchemaLiteral);

// aggregate the document type from the schema
export type PostDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;

// create the typed RxJsonSchema from the literal typed object.
export const postSchema: RxJsonSchema<PostDocType> = postSchemaLiteral;

export type PostDocMethods = {
  add: (name: string) => PostDocType;
};

export type PostDocument = RxDocument<PostDocType, PostDocMethods>;


export type PostCollectionMethods = {
  countAllDocuments: () => Promise<number>;
}

export type PostCollection = RxCollection<PostDocType, PostDocMethods, PostCollectionMethods>;


