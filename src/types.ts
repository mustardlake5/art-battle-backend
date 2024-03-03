export type User = {
  socketId: string;
  userName: string;
};

export type Room = {
  id: string;
  roomName: string;
  matching: boolean;
  user1: User;
  user2?: User;
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
  roomId?: string;
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
