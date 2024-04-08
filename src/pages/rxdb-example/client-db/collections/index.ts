import type { PostCollection } from './post'
import type { UserCollection } from './user'

export interface DatabaseCollections {
  users: UserCollection
  posts: PostCollection
}
