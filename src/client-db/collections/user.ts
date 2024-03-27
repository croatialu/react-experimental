import { nanoid } from "nanoid";
import { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxDocument, RxJsonSchema, toTypedRxJsonSchema } from "rxdb";

export const userSchemaLiteral = {
  version: 0,
  title: 'user schema with indexes',
  primaryKey: 'nanoId',
  type: 'object',
  properties: {
    id: {
      type: 'number',
      default: 1
    },
    nanoId: {
      type: 'string',
      maxLength: 21
    },
    name: {
      type: 'string',
      maxLength: 100 // <- string-fields that are used as an index, must have set maxLength.
    },
    createAt: {
      type: 'string',
      format: 'date-time'
    }
  },
  required: [
    'nanoId',
    'name',
    'createAt'
  ],
  indexes: [
    'name'
  ]
} as const;

const schemaTyped = toTypedRxJsonSchema(userSchemaLiteral);

// aggregate the document type from the schema
export type UserDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;

// create the typed RxJsonSchema from the literal typed object.
export const userSchema: RxJsonSchema<UserDocType> = userSchemaLiteral;



export type UserDocMethods = {
  hello: () => void;
};

export type UserDocument = RxDocument<UserDocType, UserDocMethods>;


export type UserCollectionMethods = {
  add: (payload: Pick<UserDocType, 'name'>) => Promise<UserDocument>;
}

export type UserCollection = RxCollection<UserDocType, UserDocMethods, UserCollectionMethods>;


export const userDocMethods: UserDocMethods = {
  hello(this: UserDocument) {
    console.log(this.name, 'xxx')
  }
};

export const userCollectionMethods: UserCollectionMethods = {
  async add(this: UserCollection, payload) {
    const totalCount = await this.count().exec();
    const lastItem = await this.findOne({
      selector: {
        nanoId: { $eq: totalCount }
      }
    }).exec();
    const doc = await this.insert({
      id: totalCount + 1,
      nanoId: nanoid(21),
      name: payload.name,
      createAt: new Date().toISOString()
    });
    return doc
    // return {
    //   id: nanoid(21), 
    //   name: payload.name,
    //   createAt: new Date().toISOString()
    // };
  }
}