import { Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  BattleResultMessageFromClient,
  BothPlayerSelectDoneMessage,
  CreateRoomMessageFromClient,
  CreateRoomMessageToClient,
  EitherPlayerSelectDoneMessage,
  PurchaseDoneMessageFromClient,
  PurchaseDoneMessageToClient,
  Room,
  SelectItemDoneMessageFromClient,
} from 'src/types';
import { v4 as uuidv4 } from 'uuid';

uuidv4();

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  private rooms: Room[] = [];

  private logger: Logger = new Logger('EventsGateway');

  @SubscribeMessage('createRoom')
  handleReceivedCreateRoomMessage(
    @MessageBody() message: CreateRoomMessageFromClient,
    @ConnectedSocket() client: Socket,
  ): void {
    this.logger.log('received: createRoomMessage');
    this.logger.log(message);

    let isRoomOwner: boolean = true;
    let roomIndex: number;
    let matching: boolean = false;

    for (let i = 0; i < this.rooms.length; i++) {
      // マッチング中のルームは無視
      if (this.rooms[i]['matching']) continue;

      // マッチするルームがないものは無視
      if (this.rooms[i]['roomName'] !== message.roomName) continue;

      // matching: falseなルームでuser2が存在することはないので、
      // 通常この条件は処理されないが念のためuser2が存在する場合もcontinue
      if (this.rooms[i]['user2']) continue;

      // 以降はルームがすでに存在する場合の処理になる

      // すでにルームが存在するので、接続してきたユーザはルームオーナーではない
      isRoomOwner = false;
      roomIndex = i;

      // ルームが存在する場合、user1に待機ユーザが存在するので、
      // 今回接続してきたユーザをuser2として登録する
      this.rooms[i]['user2'] = {
        socketId: client.id,
        userName: message.userName,
        purchaseDone: false,
        artSelectDone: false,
        selectedItem: null,
      };

      // ルームが2人埋まったのでmatching: trueとする
      matching = true;
      break;
    }

    // ルームが存在しない場合、接続してきたユーザはルームオーナーとなり、ルームを作成する
    if (isRoomOwner) {
      const newRoom: Room = {
        id: uuidv4(),
        roomName: message.roomName,
        matching: false,
        prepareForBattleDone: false,
        battleItemSelectDone: false,
        user1: {
          socketId: client.id,
          userName: message.userName,
          purchaseDone: false,
          artSelectDone: false,
          selectedItem: null,
        },
      };
      this.rooms.push(newRoom);
      roomIndex = this.rooms.length - 1;
    }

    const { id: roomId, roomName, user1, user2 } = this.rooms[roomIndex];

    const messageToClient: CreateRoomMessageToClient = {
      type: 'createRoom',
      matching,
      roomIndex,
      roomId,
      roomName,
      isRoomOwner,
      user1,
      user2,
    };

    if (matching) {
      this.server.emit(`matchingSuccessToClient:${roomName}`, messageToClient);
    } else {
      this.server.emit(`createRoomToClient:${roomName}`, messageToClient);
    }
  }

  @SubscribeMessage('purchaseDone')
  handleReceivedPurchaseDoneMessage(
    @MessageBody() message: PurchaseDoneMessageFromClient,
    @ConnectedSocket() client: Socket,
  ): void {
    this.logger.log('received: purchaseDoneMessage');
    this.logger.log(message);

    const { roomIndex, roomId: roomIdFromClientMessage, user } = message;

    const room = this.rooms[roomIndex];
    if (user.socketId === room.user1.socketId) {
      room.user1.purchaseDone = true;
    } else {
      room.user2.purchaseDone = true;
    }

    if (room.user1.purchaseDone && room.user2.purchaseDone) {
      room.prepareForBattleDone = true;
    }

    const { id: roomId, roomName, prepareForBattleDone, user1, user2 } = room;

    const messageToClient: PurchaseDoneMessageToClient = {
      type: 'purchaseDone',
      roomId,
      roomName,
      prepareForBattleDone,
      user1,
      user2,
    };

    if (prepareForBattleDone) {
      this.server.emit(
        `prepareForBattleDoneToClient:${roomId}`,
        messageToClient,
      );
    } else {
      this.server.emit(`purchaseDoneToClient:${roomId}`, messageToClient);
    }
  }

  @SubscribeMessage('selectItemDone')
  handleReceivedBattleItemSelectDoneMessage(
    @MessageBody() message: SelectItemDoneMessageFromClient,
    @ConnectedSocket() client: Socket,
  ): void {
    this.logger.log('received: battleItemSelectDoneMessage');
    this.logger.log(message);

    const { roomIndex, roomId: roomIdFromClientMessage, user } = message;

    const room = this.rooms[roomIndex];
    if (user.socketId === room.user1.socketId) {
      room.user1.artSelectDone = true;
      room.user1.selectedItem = user.selectedItem;
    } else {
      room.user2.artSelectDone = true;
      room.user2.selectedItem = user.selectedItem;
    }

    if (room.user1.artSelectDone && room.user2.artSelectDone) {
      room.battleItemSelectDone = true;
    }

    const {
      id: roomId,
      roomName,
      battleItemSelectDone,
      user1: roomUser1,
      user2: roomUser2,
    } = room;

    if (battleItemSelectDone) {
      const messageToClient: BothPlayerSelectDoneMessage = {
        roomId,
        roomName,
        battleItemSelectDone,
        user1: roomUser1,
        user2: roomUser2,
      };
      this.server.emit(`bothPlayerSelectDone:${roomId}`, messageToClient);
    } else {
      const { selectedItem: _1, ...user1 } = roomUser1;
      const { selectedItem: _2, ...user2 } = roomUser2;
      const messageToClient: EitherPlayerSelectDoneMessage = {
        roomId,
        roomName,
        battleItemSelectDone,
        user1,
        user2,
      };
      this.server.emit(`eitherPlayerSelectDone:${roomId}`, messageToClient);
    }
  }

  @SubscribeMessage('battleResult')
  handleBattleResultMessage(
    @MessageBody() message: BattleResultMessageFromClient,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomIndex } = message;
    const room = this.rooms[roomIndex];
    const { user1, user2 } = room;

    this.logger.log('受信: battleResult');
    this.logger.log(`user1.artSelectDone: ${user1.artSelectDone}`);
    this.logger.log(`user2.artSelectDone: ${user2.artSelectDone}`);

    if (user1.artSelectDone && user2.artSelectDone) {
      room.battleItemSelectDone = false;
      user1.artSelectDone = false;
      user1.selectedItem = 'null';
      user2.artSelectDone = false;
      user2.selectedItem = 'null';
    }
  }

  afterInit(server: Server) {
    this.logger.log('初期化しました。');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @Cron('0 0 0 * * *', {
    timeZone: 'Asia/Tokyo',
  })
  handleResetRooms() {
    this.rooms = [];
    this.logger.log('success reset rooms!');
  }
}
