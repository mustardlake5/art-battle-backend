export type User = {
  socketId: string;
  userName: string;
  purchaseDone?: boolean;
  artSelectDone?: boolean;
};

export type ItemList =
  | 'fakePot'
  | 'fakeSculpture'
  | 'fakePainting'
  | 'pot'
  | 'sculpture'
  | 'painting'
  | 'null';

export type ArtSelectedUser = User & {
  selectedItem: ItemList;
};

export type Room = {
  id: string;
  roomName: string;
  matching: boolean;
  prepareForBattleDone: boolean;
  battleItemSelectDone: boolean;
  user1: Required<ArtSelectedUser>;
  user2?: Required<ArtSelectedUser>;
};

export type MessageFromServer = {
  type: 'createRoom' | 'match' | 'battle';
  data: any;
};

export type MessageFromClient = {
  type: 'createRoom' | 'match' | 'battle';
  data: any;
};

export type CreateRoomMessageFromClient = {
  type: 'createRoom';
  roomName: string;
  userName: string;
};

export type CreateRoomMessageToClient = {
  type: 'createRoom';
  matching: boolean;
  roomIndex: number;
  roomId: string;
  roomName: string;
  isRoomOwner: boolean;
  user1: {
    userName: string;
    socketId: string;
  };
  user2?: {
    userName: string;
    socketId: string;
  };
};

export type PurchaseDoneMessageFromClient = {
  type: 'purchaseDone';
  roomIndex: number;
  roomId: string;
  roomName: string;
  user: Omit<Required<User>, 'artSelectDone'>;
};

export type PurchaseDoneMessageToClient = {
  type: 'purchaseDone';
  roomId: string;
  roomName: string;
  prepareForBattleDone: boolean;
  user1: Omit<Required<User>, 'artSelectDone'>;
  user2: Omit<Required<User>, 'artSelectDone'>;
};

export type SelectItemDoneMessageFromClient = {
  roomIndex: number;
  roomId: string;
  roomName: string;
  user: Required<ArtSelectedUser>;
};

export type EitherPlayerSelectDoneMessage = {
  roomId: string;
  roomName: string;
  battleItemSelectDone: boolean;
  user1: Required<User>;
  user2: Required<User>;
};

export type BothPlayerSelectDoneMessage = {
  roomId: string;
  roomName: string;
  battleItemSelectDone: boolean;
  user1: Required<ArtSelectedUser>;
  user2: Required<ArtSelectedUser>;
};

export type BattleResultMessageFromClient = {
  roomIndex: number;
  roomId: string;
  roomName: string;
};
