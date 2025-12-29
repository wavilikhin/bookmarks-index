// Bookmarks domain - consolidated exports
export type { Bookmark, CreateBookmarkInput, UpdateBookmarkInput } from './bookmarks.types'
export { bookmarksAtom, createBookmark, updateBookmark, deleteBookmark } from './bookmarks.model'
export { getSeedBookmarks } from './lib'
