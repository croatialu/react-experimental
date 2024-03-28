import { nanoid } from 'nanoid'
import type { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxDocument, RxJsonSchema, RxStorageWriteError } from 'rxdb'
import { toTypedRxJsonSchema } from 'rxdb'

export const userSchemaLiteral = {
  version: 0,
  title: 'user schema with indexes',
  primaryKey: 'nanoId',
  type: 'object',
  properties: {
    id: {
      type: 'number',
      default: 1,
    },
    nanoId: {
      type: 'string',
      maxLength: 21,
    },
    name: {
      type: 'string',
      maxLength: 100, // <- string-fields that are used as an index, must have set maxLength.
    },
    createAt: {
      type: 'string',
      format: 'date-time',
      maxLength: 100,
    },
  },
  required: [
    'id',
    'nanoId',
    'name',
    'createAt',
  ],
  indexes: [
    'name',
    'createAt',
  ],
} as const

const schemaTyped = toTypedRxJsonSchema(userSchemaLiteral)

// aggregate the document type from the schema
export type UserDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>

// create the typed RxJsonSchema from the literal typed object.
export const userSchema: RxJsonSchema<UserDocType> = userSchemaLiteral

export interface UserDocMethods {
  removeSelf: () => Promise<void>
}

export type UserDocument = RxDocument<UserDocType, UserDocMethods>

export interface UserCollectionMethods {
  addUser: (payload: Pick<UserDocType, 'name'>) => Promise<UserDocument>
  removeUser: (payload: { nanoIds: string[] }) => Promise<{
    success: RxDocument<UserDocType, UserDocMethods>[]
    error: RxStorageWriteError<UserDocType>[]
  }>
}

export type UserCollection = RxCollection<UserDocType, UserDocMethods, UserCollectionMethods>

export const userDocMethods: UserDocMethods = {
  async removeSelf(this: UserDocument) {
    return void await this.collection.bulkRemove([this.nanoId])
  },
}

export const userCollectionMethods: UserCollectionMethods = {
  async addUser(this: UserCollection, payload) {
    const lastItem = await this.findOne({
      sort: [
        {
          createAt: 'desc',
        },
      ],
    }).exec()
    const data = {
      id: (lastItem?.id || 0) + 1,
      nanoId: nanoid(21),
      name: payload.name,
      createAt: new Date().toISOString(),
    }
    console.log(data, 'data')
    const doc = await this.insert(data)
    return doc
  },
  async removeUser(this: UserCollection, payload: { nanoIds: string[] }) {
    return this.bulkRemove(payload.nanoIds)
  },
}
