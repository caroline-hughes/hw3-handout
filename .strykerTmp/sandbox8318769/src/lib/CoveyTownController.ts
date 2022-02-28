// @ts-nocheck
function stryNS_9fa48() {
  var g = new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});

  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }

  function retrieveNS() {
    return ns;
  }

  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}

stryNS_9fa48();

function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });

  function cover() {
    var c = cov.static;

    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }

    var a = arguments;

    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }

  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}

function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();

  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }

      return true;
    }

    return false;
  }

  stryMutAct_9fa48 = isActive;
  return isActive(id);
}

import { customAlphabet, nanoid } from 'nanoid';
import { BoundingBox, ServerConversationArea } from '../client/TownsServiceClient';
import { UserLocation } from '../CoveyTypes';
import CoveyTownListener from '../types/CoveyTownListener';
import Player from '../types/Player';
import PlayerSession from '../types/PlayerSession';
import IVideoClient from './IVideoClient';
import TwilioVideo from './TwilioVideo';
const friendlyNanoID = customAlphabet('1234567890ABCDEF', 8);
/**
 * The CoveyTownController implements the logic for each town: managing the various events that
 * can occur (e.g. joining a town, moving, leaving a town)
 */

export default class CoveyTownController {
  get capacity(): number {
    return this._capacity;
  }

  set isPubliclyListed(value: boolean) {
    this._isPubliclyListed = value;
  }

  get isPubliclyListed(): boolean {
    return this._isPubliclyListed;
  }

  get townUpdatePassword(): string {
    return this._townUpdatePassword;
  }

  get players(): Player[] {
    return this._players;
  }

  get occupancy(): number {
    return this._listeners.length;
  }

  get friendlyName(): string {
    return this._friendlyName;
  }

  set friendlyName(value: string) {
    this._friendlyName = value;
  }

  get coveyTownID(): string {
    return this._coveyTownID;
  }

  get conversationAreas(): ServerConversationArea[] {
    return this._conversationAreas;
  }
  /** The list of players currently in the town * */


  private _players: Player[] = [];
  /** The list of valid sessions for this town * */

  private _sessions: PlayerSession[] = [];
  /** The videoClient that this CoveyTown will use to provision video resources * */

  private _videoClient: IVideoClient = TwilioVideo.getInstance();
  /** The list of CoveyTownListeners that are subscribed to events in this town * */

  private _listeners: CoveyTownListener[] = [];
  /** The list of currently active ConversationAreas in this town */

  private _conversationAreas: ServerConversationArea[] = [];
  private readonly _coveyTownID: string;
  private _friendlyName: string;
  private readonly _townUpdatePassword: string;
  private _isPubliclyListed: boolean;
  private _capacity: number;

  constructor(friendlyName: string, isPubliclyListed: boolean) {
    this._coveyTownID = process.env.DEMO_TOWN_ID === friendlyName ? friendlyName : friendlyNanoID();
    this._capacity = 50;
    this._townUpdatePassword = nanoid(24);
    this._isPubliclyListed = isPubliclyListed;
    this._friendlyName = friendlyName;
  }
  /**
   * Adds a player to this Covey Town, provisioning the necessary credentials for the
   * player, and returning them
   *
   * @param newPlayer The new player to add to the town
   */


  async addPlayer(newPlayer: Player): Promise<PlayerSession> {
    const theSession = new PlayerSession(newPlayer);

    this._sessions.push(theSession);

    this._players.push(newPlayer); // Create a video token for this user to join this town


    theSession.videoToken = await this._videoClient.getTokenForTown(this._coveyTownID, newPlayer.id); // Notify other players that this player has joined

    this._listeners.forEach(listener => listener.onPlayerJoined(newPlayer));

    return theSession;
  }
  /**
   * Destroys all data related to a player in this town.
   *
   * @param session PlayerSession to destroy
   */


  destroySession(session: PlayerSession): void {
    this._players = this._players.filter(p => p.id !== session.player.id);
    this._sessions = this._sessions.filter(s => s.sessionToken !== session.sessionToken);

    this._listeners.forEach(listener => listener.onPlayerDisconnected(session.player));

    const conversation = session.player.activeConversationArea;

    if (stryMutAct_9fa48("1") ? false : stryMutAct_9fa48("0") ? true : (stryCov_9fa48("0", "1"), conversation)) {
      if (stryMutAct_9fa48("2")) {
        {}
      } else {
        stryCov_9fa48("2");
        this.removePlayerFromConversationArea(session.player, conversation);
      }
    }
  }
  /**
   * Updates the location of a player within the town
   * 
   * If the player has changed conversation areas, this method also updates the
   * corresponding ConversationArea objects tracked by the town controller, and dispatches
   * any onConversationUpdated events as appropriate
   * 
   * @param player Player to update location for
   * @param location New location for this player
   */


  updatePlayerLocation(player: Player, location: UserLocation): void {
    const conversation = this.conversationAreas.find(stryMutAct_9fa48("3") ? () => undefined : (stryCov_9fa48("3"), conv => stryMutAct_9fa48("6") ? conv.label !== location.conversationLabel : stryMutAct_9fa48("5") ? false : stryMutAct_9fa48("4") ? true : (stryCov_9fa48("4", "5", "6"), conv.label === location.conversationLabel)));
    const prevConversation = player.activeConversationArea;
    player.location = location;
    player.activeConversationArea = conversation;

    if (stryMutAct_9fa48("9") ? conversation === prevConversation : stryMutAct_9fa48("8") ? false : stryMutAct_9fa48("7") ? true : (stryCov_9fa48("7", "8", "9"), conversation !== prevConversation)) {
      if (stryMutAct_9fa48("10")) {
        {}
      } else {
        stryCov_9fa48("10");

        if (stryMutAct_9fa48("12") ? false : stryMutAct_9fa48("11") ? true : (stryCov_9fa48("11", "12"), prevConversation)) {
          if (stryMutAct_9fa48("13")) {
            {}
          } else {
            stryCov_9fa48("13");
            this.removePlayerFromConversationArea(player, prevConversation);
          }
        }

        if (stryMutAct_9fa48("15") ? false : stryMutAct_9fa48("14") ? true : (stryCov_9fa48("14", "15"), conversation)) {
          if (stryMutAct_9fa48("16")) {
            {}
          } else {
            stryCov_9fa48("16");
            conversation.occupantsByID.push(player.id);

            this._listeners.forEach(stryMutAct_9fa48("17") ? () => undefined : (stryCov_9fa48("17"), listener => listener.onConversationAreaUpdated(conversation)));
          }
        }
      }
    }

    this._listeners.forEach(stryMutAct_9fa48("18") ? () => undefined : (stryCov_9fa48("18"), listener => listener.onPlayerMoved(player)));
  }
  /**
   * Removes a player from a conversation area, updating the conversation area's occupants list, 
   * and emitting the appropriate message (area updated or area destroyed)
   * 
   * Does not update the player's activeConversationArea property.
   * 
   * @param player Player to remove from conversation area
   * @param conversation Conversation area to remove player from
   */


  removePlayerFromConversationArea(player: Player, conversation: ServerConversationArea): void {
    conversation.occupantsByID.splice(conversation.occupantsByID.findIndex(stryMutAct_9fa48("19") ? () => undefined : (stryCov_9fa48("19"), p => stryMutAct_9fa48("22") ? p !== player.id : stryMutAct_9fa48("21") ? false : stryMutAct_9fa48("20") ? true : (stryCov_9fa48("20", "21", "22"), p === player.id))), 1);

    if (stryMutAct_9fa48("25") ? conversation.occupantsByID.length !== 0 : stryMutAct_9fa48("24") ? false : stryMutAct_9fa48("23") ? true : (stryCov_9fa48("23", "24", "25"), conversation.occupantsByID.length === 0)) {
      if (stryMutAct_9fa48("26")) {
        {}
      } else {
        stryCov_9fa48("26");

        this._conversationAreas.splice(this._conversationAreas.findIndex(stryMutAct_9fa48("27") ? () => undefined : (stryCov_9fa48("27"), conv => stryMutAct_9fa48("30") ? conv !== conversation : stryMutAct_9fa48("29") ? false : stryMutAct_9fa48("28") ? true : (stryCov_9fa48("28", "29", "30"), conv === conversation))), 1);

        this._listeners.forEach(stryMutAct_9fa48("31") ? () => undefined : (stryCov_9fa48("31"), listener => listener.onConversationAreaDestroyed(conversation)));
      }
    } else {
      if (stryMutAct_9fa48("32")) {
        {}
      } else {
        stryCov_9fa48("32");

        this._listeners.forEach(stryMutAct_9fa48("33") ? () => undefined : (stryCov_9fa48("33"), listener => listener.onConversationAreaUpdated(conversation)));
      }
    }
  }
  /**
   * Creates a new conversation area in this town if there is not currently an active
   * conversation with the same label.
   *
   * Adds any players who are in the region defined by the conversation area to it.
   *
   * Notifies any CoveyTownListeners that the conversation has been updated
   *
   * @param _conversationArea Information describing the conversation area to create. Ignores any
   *  occupantsById that are set on the conversation area that is passed to this method.
   *
   * @returns true if the conversation is successfully created, or false if not
   */


  addConversationArea(_conversationArea: ServerConversationArea): boolean {
    if (stryMutAct_9fa48("34")) {
      {}
    } else {
      stryCov_9fa48("34");
      if (stryMutAct_9fa48("36") ? false : stryMutAct_9fa48("35") ? true : (stryCov_9fa48("35", "36"), this._conversationAreas.find(stryMutAct_9fa48("37") ? () => undefined : (stryCov_9fa48("37"), eachExistingConversation => stryMutAct_9fa48("40") ? eachExistingConversation.label !== _conversationArea.label : stryMutAct_9fa48("39") ? false : stryMutAct_9fa48("38") ? true : (stryCov_9fa48("38", "39", "40"), eachExistingConversation.label === _conversationArea.label))))) return stryMutAct_9fa48("41") ? true : (stryCov_9fa48("41"), false);

      if (stryMutAct_9fa48("44") ? _conversationArea.topic !== '' : stryMutAct_9fa48("43") ? false : stryMutAct_9fa48("42") ? true : (stryCov_9fa48("42", "43", "44"), _conversationArea.topic === (stryMutAct_9fa48("45") ? "Stryker was here!" : (stryCov_9fa48("45"), '')))) {
        if (stryMutAct_9fa48("46")) {
          {}
        } else {
          stryCov_9fa48("46");
          return stryMutAct_9fa48("47") ? true : (stryCov_9fa48("47"), false);
        }
      }

      if (stryMutAct_9fa48("50") ? this._conversationAreas.find(eachExistingConversation => CoveyTownController.boxesOverlap(eachExistingConversation.boundingBox, _conversationArea.boundingBox)) === undefined : stryMutAct_9fa48("49") ? false : stryMutAct_9fa48("48") ? true : (stryCov_9fa48("48", "49", "50"), this._conversationAreas.find(stryMutAct_9fa48("51") ? () => undefined : (stryCov_9fa48("51"), eachExistingConversation => CoveyTownController.boxesOverlap(eachExistingConversation.boundingBox, _conversationArea.boundingBox))) !== undefined)) {
        if (stryMutAct_9fa48("52")) {
          {}
        } else {
          stryCov_9fa48("52");
          return stryMutAct_9fa48("53") ? true : (stryCov_9fa48("53"), false);
        }
      }

      const newArea: ServerConversationArea = Object.assign(_conversationArea);

      this._conversationAreas.push(newArea);

      const playersInThisConversation = this.players.filter(stryMutAct_9fa48("54") ? () => undefined : (stryCov_9fa48("54"), player => player.isWithin(newArea)));
      playersInThisConversation.forEach(player => {
        if (stryMutAct_9fa48("55")) {
          {}
        } else {
          stryCov_9fa48("55");
          player.activeConversationArea = newArea;
        }
      });
      newArea.occupantsByID = playersInThisConversation.map(stryMutAct_9fa48("56") ? () => undefined : (stryCov_9fa48("56"), player => player.id));

      this._listeners.forEach(stryMutAct_9fa48("57") ? () => undefined : (stryCov_9fa48("57"), listener => listener.onConversationAreaUpdated(newArea)));

      return stryMutAct_9fa48("58") ? false : (stryCov_9fa48("58"), true);
    }
  }
  /**
   * Detects whether two bounding boxes overlap and share any points
   * 
   * @param box1 
   * @param box2 
   * @returns true if the boxes overlap, otherwise false
   */


  static boxesOverlap(box1: BoundingBox, box2: BoundingBox): boolean {
    // Helper function to extract the top left (x1,y1) and bottom right corner (x2,y2) of each bounding box
    const toRectPoints = stryMutAct_9fa48("59") ? () => undefined : (stryCov_9fa48("59"), (() => {
      const toRectPoints = (box: BoundingBox) => stryMutAct_9fa48("60") ? {} : (stryCov_9fa48("60"), {
        x1: stryMutAct_9fa48("61") ? box.x + box.width / 2 : (stryCov_9fa48("61"), box.x - (stryMutAct_9fa48("62") ? box.width * 2 : (stryCov_9fa48("62"), box.width / 2))),
        x2: stryMutAct_9fa48("63") ? box.x - box.width / 2 : (stryCov_9fa48("63"), box.x + (stryMutAct_9fa48("64") ? box.width * 2 : (stryCov_9fa48("64"), box.width / 2))),
        y1: stryMutAct_9fa48("65") ? box.y + box.height / 2 : (stryCov_9fa48("65"), box.y - (stryMutAct_9fa48("66") ? box.height * 2 : (stryCov_9fa48("66"), box.height / 2))),
        y2: stryMutAct_9fa48("67") ? box.y - box.height / 2 : (stryCov_9fa48("67"), box.y + (stryMutAct_9fa48("68") ? box.height * 2 : (stryCov_9fa48("68"), box.height / 2)))
      });

      return toRectPoints;
    })());
    const rect1 = toRectPoints(box1);
    const rect2 = toRectPoints(box2);
    const noOverlap = stryMutAct_9fa48("71") ? (rect1.x1 >= rect2.x2 || rect2.x1 >= rect1.x2 || rect1.y1 >= rect2.y2) && rect2.y1 >= rect1.y2 : stryMutAct_9fa48("70") ? false : stryMutAct_9fa48("69") ? true : (stryCov_9fa48("69", "70", "71"), (stryMutAct_9fa48("73") ? (rect1.x1 >= rect2.x2 || rect2.x1 >= rect1.x2) && rect1.y1 >= rect2.y2 : stryMutAct_9fa48("72") ? false : (stryCov_9fa48("72", "73"), (stryMutAct_9fa48("75") ? rect1.x1 >= rect2.x2 && rect2.x1 >= rect1.x2 : stryMutAct_9fa48("74") ? false : (stryCov_9fa48("74", "75"), (stryMutAct_9fa48("78") ? rect1.x1 < rect2.x2 : stryMutAct_9fa48("77") ? rect1.x1 > rect2.x2 : stryMutAct_9fa48("76") ? false : (stryCov_9fa48("76", "77", "78"), rect1.x1 >= rect2.x2)) || (stryMutAct_9fa48("81") ? rect2.x1 < rect1.x2 : stryMutAct_9fa48("80") ? rect2.x1 > rect1.x2 : stryMutAct_9fa48("79") ? false : (stryCov_9fa48("79", "80", "81"), rect2.x1 >= rect1.x2)))) || (stryMutAct_9fa48("84") ? rect1.y1 < rect2.y2 : stryMutAct_9fa48("83") ? rect1.y1 > rect2.y2 : stryMutAct_9fa48("82") ? false : (stryCov_9fa48("82", "83", "84"), rect1.y1 >= rect2.y2)))) || (stryMutAct_9fa48("87") ? rect2.y1 < rect1.y2 : stryMutAct_9fa48("86") ? rect2.y1 > rect1.y2 : stryMutAct_9fa48("85") ? false : (stryCov_9fa48("85", "86", "87"), rect2.y1 >= rect1.y2)));
    return stryMutAct_9fa48("88") ? noOverlap : (stryCov_9fa48("88"), !noOverlap);
  }
  /**
   * Subscribe to events from this town. Callers should make sure to
   * unsubscribe when they no longer want those events by calling removeTownListener
   *
   * @param listener New listener
   */


  addTownListener(listener: CoveyTownListener): void {
    this._listeners.push(listener);
  }
  /**
   * Unsubscribe from events in this town.
   *
   * @param listener The listener to unsubscribe, must be a listener that was registered
   * with addTownListener, or otherwise will be a no-op
   */


  removeTownListener(listener: CoveyTownListener): void {
    this._listeners = this._listeners.filter(v => v !== listener);
  }
  /**
   * Fetch a player's session based on the provided session token. Returns undefined if the
   * session token is not valid.
   *
   * @param token
   */


  getSessionByToken(token: string): PlayerSession | undefined {
    return this._sessions.find(p => p.sessionToken === token);
  }

  disconnectAllPlayers(): void {
    this._listeners.forEach(listener => listener.onTownDestroyed());
  }

}