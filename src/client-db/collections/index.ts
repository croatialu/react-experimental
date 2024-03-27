import { PostCollection } from "./post"
import { UserCollection } from "./user"

export type DatabaseCollections = {
  users: UserCollection,
  posts: PostCollection
}

