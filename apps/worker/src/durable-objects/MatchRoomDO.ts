import {
  expandDeckToInstances,
  secureRandom,
  shuffle,
  type BattlefieldCard,
  type ClientAction,
  type PlayerView,
  type RoomView,
  type SealedPoolEntry,
  type ServerEvent,
  type Zone,
} from "@hob/shared";
import type { Env } from "../types.js";

interface InternalPlayerState {
  userId: string;
  displayName: string;
  connected: boolean;
  life: number;
  hand: string[];
  library: string[];
  graveyard: string[];
  exile: string[];
}

interface InternalRoomState {
  roomCode: string;
  status: "waiting" | "active" | "finished";
  players: InternalPlayerState[];
  battlefield: BattlefieldCard[];
  cardIndex: Record<string, string>;
  playerTokens: Record<string, string>;
  nextInstanceSeq: number;
}

interface RegisterBody {
  role: "player1" | "player2";
  userId: string;
  displayName: string;
  maindeck: SealedPoolEntry[];
}

const STARTING_LIFE = 20;
const STARTING_HAND_SIZE = 7;

export class MatchRoomDO {
  state: DurableObjectState;
  env: Env;
  room: InternalRoomState | null = null;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.state.blockConcurrencyWhile(async () => {
      this.room = (await this.state.storage.get<InternalRoomState>("room")) ?? null;
    });
  }

  private async persist(): Promise<void> {
    await this.state.storage.put("room", this.room);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname.endsWith("/register")) {
      return this.handleRegister(request);
    }
    if (url.pathname.endsWith("/socket")) {
      return this.handleSocketUpgrade(request);
    }
    return new Response("not found", { status: 404 });
  }

  private expandDeck(maindeck: SealedPoolEntry[]): string[] {
    if (!this.room) throw new Error("room not initialized");
    const { instanceIds, nextSeq } = expandDeckToInstances(maindeck, this.room.cardIndex, this.room.nextInstanceSeq);
    this.room.nextInstanceSeq = nextSeq;
    return instanceIds;
  }

  private async handleRegister(request: Request): Promise<Response> {
    const body = await request.json<RegisterBody & { roomCode: string }>();

    if (body.role === "player1") {
      if (!this.room) {
        this.room = {
          roomCode: body.roomCode,
          status: "waiting",
          players: [],
          battlefield: [],
          cardIndex: {},
          playerTokens: {},
          nextInstanceSeq: 0,
        };
      }
      const existing = this.room.players.find((p) => p.userId === body.userId);
      if (existing) {
        const token = Object.entries(this.room.playerTokens).find(([, uid]) => uid === body.userId)?.[0];
        return Response.json({ token });
      }

      const library = shuffle(this.expandDeck(body.maindeck), secureRandom);
      this.room.players.push({
        userId: body.userId,
        displayName: body.displayName,
        connected: false,
        life: STARTING_LIFE,
        hand: [],
        library,
        graveyard: [],
        exile: [],
      });
      const token = crypto.randomUUID();
      this.room.playerTokens[token] = body.userId;
      await this.persist();
      return Response.json({ token });
    }

    // player2
    if (!this.room || this.room.status !== "waiting" || this.room.players.length !== 1) {
      return Response.json({ error: "sala indisponível para entrar" }, { status: 409 });
    }
    if (this.room.players[0].userId === body.userId) {
      return Response.json({ error: "você já está nesta sala" }, { status: 409 });
    }

    const library = shuffle(this.expandDeck(body.maindeck), secureRandom);
    this.room.players.push({
      userId: body.userId,
      displayName: body.displayName,
      connected: false,
      life: STARTING_LIFE,
      hand: [],
      library,
      graveyard: [],
      exile: [],
    });

    for (const player of this.room.players) {
      player.hand = player.library.slice(0, STARTING_HAND_SIZE);
      player.library = player.library.slice(STARTING_HAND_SIZE);
    }
    this.room.status = "active";

    const token = crypto.randomUUID();
    this.room.playerTokens[token] = body.userId;
    await this.persist();
    return Response.json({ token });
  }

  private async handleSocketUpgrade(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("expected websocket", { status: 426 });
    }
    const token = new URL(request.url).searchParams.get("token") ?? "";
    const playerId = this.room?.playerTokens[token];
    if (!this.room || !playerId) {
      return new Response("unauthorized", { status: 401 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.state.acceptWebSocket(server, [playerId]);

    const player = this.room.players.find((p) => p.userId === playerId)!;
    player.connected = true;
    await this.persist();
    this.broadcast();

    return new Response(null, { status: 101, webSocket: client });
  }

  private playerIdForSocket(ws: WebSocket): string | null {
    const tags = this.state.getTags(ws);
    return tags[0] ?? null;
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const playerId = this.playerIdForSocket(ws);
    if (!playerId || !this.room) return;

    try {
      const action = JSON.parse(typeof message === "string" ? message : "") as ClientAction;
      this.applyAction(playerId, action);
      await this.persist();
      this.broadcast();
    } catch (error) {
      const event: ServerEvent = { type: "ERROR", message: error instanceof Error ? error.message : "ação inválida" };
      ws.send(JSON.stringify(event));
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const playerId = this.playerIdForSocket(ws);
    if (!playerId || !this.room) return;
    const player = this.room.players.find((p) => p.userId === playerId);
    if (player) player.connected = false;
    await this.persist();
    this.broadcast();
  }

  private applyAction(playerId: string, action: ClientAction): void {
    if (!this.room) return;
    const room = this.room;
    const player = room.players.find((p) => p.userId === playerId);
    if (!player) throw new Error("jogador não faz parte desta sala");

    switch (action.type) {
      case "TAP_TOGGLE": {
        const card = room.battlefield.find((c) => c.instanceId === action.instanceId);
        if (!card) throw new Error("carta não encontrada no campo");
        card.tapped = !card.tapped;
        return;
      }
      case "MOVE_CARD": {
        this.moveCard(player, action.instanceId, action.toZone, action.faceDown ?? false);
        return;
      }
      case "DRAW_CARD": {
        const count = action.count ?? 1;
        for (let i = 0; i < count; i++) {
          const instanceId = player.library.shift();
          if (!instanceId) break;
          player.hand.push(instanceId);
        }
        return;
      }
      case "SHUFFLE_LIBRARY": {
        player.library = shuffle(player.library, secureRandom);
        return;
      }
      case "SET_LIFE": {
        player.life += action.delta;
        return;
      }
      case "ADD_COUNTER": {
        const card = room.battlefield.find((c) => c.instanceId === action.instanceId);
        if (!card) throw new Error("carta não encontrada no campo");
        card.counters[action.counterType] = (card.counters[action.counterType] ?? 0) + action.delta;
        return;
      }
      case "SET_POSITION": {
        const card = room.battlefield.find((c) => c.instanceId === action.instanceId);
        if (!card) throw new Error("carta não encontrada no campo");
        card.x = action.x;
        card.y = action.y;
        return;
      }
      case "MULLIGAN": {
        player.library = shuffle([...player.library, ...player.hand], secureRandom);
        player.hand = player.library.slice(0, STARTING_HAND_SIZE);
        player.library = player.library.slice(STARTING_HAND_SIZE);
        return;
      }
      case "CONCEDE": {
        room.status = "finished";
        return;
      }
    }
  }

  private removeFromZone(player: InternalPlayerState, instanceId: string): boolean {
    for (const zone of ["hand", "library", "graveyard", "exile"] as const) {
      const idx = player[zone].indexOf(instanceId);
      if (idx !== -1) {
        player[zone].splice(idx, 1);
        return true;
      }
    }
    if (!this.room) return false;
    const bfIdx = this.room.battlefield.findIndex((c) => c.instanceId === instanceId);
    if (bfIdx !== -1) {
      this.room.battlefield.splice(bfIdx, 1);
      return true;
    }
    return false;
  }

  private moveCard(player: InternalPlayerState, instanceId: string, toZone: Zone, faceDown: boolean): void {
    if (!this.room) return;
    const found = this.removeFromZone(player, instanceId);
    if (!found) throw new Error("carta não encontrada em nenhuma zona do jogador");

    if (toZone === "battlefield") {
      this.room.battlefield.push({
        instanceId,
        cardId: this.room.cardIndex[instanceId],
        controllerId: player.userId,
        tapped: false,
        counters: {},
        x: 0,
        y: 0,
        faceDown,
        attachedTo: null,
      });
      return;
    }
    player[toZone].push(instanceId);
  }

  private viewFor(viewerId: string): RoomView {
    if (!this.room) throw new Error("room not initialized");
    const room = this.room;

    const players: PlayerView[] = room.players.map((p) => ({
      userId: p.userId,
      displayName: p.displayName,
      connected: p.connected,
      life: p.life,
      handCount: p.hand.length,
      libraryCount: p.library.length,
      hand: p.userId === viewerId ? p.hand.map((id) => ({ instanceId: id, cardId: room.cardIndex[id] })) : null,
      graveyard: p.graveyard.map((id) => ({ instanceId: id, cardId: room.cardIndex[id] })),
      exile: p.exile.map((id) => ({ instanceId: id, cardId: room.cardIndex[id] })),
    }));

    const battlefield: BattlefieldCard[] = room.battlefield.map((card) => ({
      ...card,
      cardId: card.faceDown && card.controllerId !== viewerId ? null : card.cardId,
    }));

    return { roomCode: room.roomCode, status: room.status, players, battlefield };
  }

  private broadcast(): void {
    if (!this.room) return;
    for (const ws of this.state.getWebSockets()) {
      const playerId = this.playerIdForSocket(ws);
      if (!playerId) continue;
      const event: ServerEvent = { type: "SNAPSHOT", state: this.viewFor(playerId) };
      ws.send(JSON.stringify(event));
    }
  }
}
