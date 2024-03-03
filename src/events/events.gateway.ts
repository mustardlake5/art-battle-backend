import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  CreateRoomMessageFromClient,
  CreateRoomMessageToClient,
  Room,
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
        user1: {
          socketId: client.id,
          userName: message.userName,
        },
      };
      this.rooms.push(newRoom);
      roomIndex = this.rooms.length - 1;
    }

    const { id: roomId, roomName, user1, user2 } = this.rooms[roomIndex];

    const messageToClient: CreateRoomMessageToClient = {
      type: 'createRoom',
      matching,
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

  afterInit(server: Server) {
    this.logger.log('初期化しました。');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}
