import { nanoid } from 'nanoid'
import type { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxDocument, RxJsonSchema } from 'rxdb'
import { toTypedRxJsonSchema } from 'rxdb'
import { CollectionDocToParams } from './types'

export const postSchemaLiteral = {
  version: 0,
  title: 'post schema with indexes',
  primaryKey: 'nanoId',
  type: 'object',
  properties: {
    id: {
      type: 'number',
      unique: true,
    },
    nanoId: {
      type: 'string',
      maxLength: 100,
    },
    title: {
      type: 'string',
      maxLength: 100, // <- string-fields that are used as an index, must have set maxLength.
    },
    content: {
      type: 'string',
      maxLength: 1000,
    },
    userId: {
      type: 'string',
      maxLength: 100,
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
    'createAt',
    'userId',
  ],
  indexes: [
    'createAt',
    'userId',
  ],
} as const

const schemaTyped = toTypedRxJsonSchema(postSchemaLiteral)

// aggregate the document type from the schema
export type PostDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>

// create the typed RxJsonSchema from the literal typed object.
export const postSchema: RxJsonSchema<PostDocType> = postSchemaLiteral

export interface PostDocMethods {
}

export type PostDocument = RxDocument<PostDocType, PostDocMethods>

export interface PostCollectionMethods {
  addPost: (payload: CollectionDocToParams<PostDocType>) => Promise<PostDocument>
}

export const postCollectionMethods: PostCollectionMethods = {
  async addPost(
    this: PostCollection,
    payload: CollectionDocToParams<PostDocType>
  ) {
    const lastItem = await this.findOne({
      sort: [
        {
          createAt: 'desc',
        },
      ],
    }).exec()

    const data = {
      ...payload,
      id: (lastItem?.id || 0) + 1,
      nanoId: nanoid(21),
      createAt: new Date().toISOString(),
    }
    const doc = await this.insert(data)
    return doc
  },

}

export type PostCollection = RxCollection<PostDocType, PostDocMethods, PostCollectionMethods>
