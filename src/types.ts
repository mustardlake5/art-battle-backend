export type User = {
  socketId: string;
  userName: string;
  purchaseDone?: boolean;
};

export type Room = {
  id: string;
  roomName: string;
  matching: boolean;
  prepareForBattleDone: boolean;
  user1: Required<User>;
  user2?: Required<User>;
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
  user: Required<User>;
};

export type PurchaseDoneMessageToClient = {
  type: 'purchaseDone';
  roomId: string;
  roomName: string;
  prepareForBattleDone: boolean;
  user1: Required<User>;
  user2: Required<User>;
};
