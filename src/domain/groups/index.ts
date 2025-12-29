// Groups domain - consolidated exports
export type { Group, CreateGroupInput, UpdateGroupInput } from './group.types'
export { getSeedGroups } from './lib'
export { createGroup, deleteGroup, groupsAtom, updateGroup } from './groups.model'
