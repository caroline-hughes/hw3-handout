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

import { nanoid } from 'nanoid';
import { ServerConversationArea } from '../client/TownsServiceClient';
import { UserLocation } from '../CoveyTypes';
/**
 * Each user who is connected to a town is represented by a Player object
 */

export default class Player {
  /** The current location of this user in the world map * */
  public location: UserLocation;
  /** The unique identifier for this player * */

  private readonly _id: string;
  /** The player's username, which is not guaranteed to be unique within the town * */

  private readonly _userName: string;
  /** The current ConversationArea that the player is in, or undefined if they are not located within one */

  private _activeConversationArea?: ServerConversationArea;

  constructor(userName: string) {
    this.location = {
      x: 0,
      y: 0,
      moving: false,
      rotation: 'front'
    };
    this._userName = userName;
    this._id = nanoid();
  }

  get userName(): string {
    return this._userName;
  }

  get id(): string {
    return this._id;
  }

  get activeConversationArea(): ServerConversationArea | undefined {
    return this._activeConversationArea;
  }

  set activeConversationArea(conversationArea: ServerConversationArea | undefined) {
    this._activeConversationArea = conversationArea;
  }
  /**
   * Checks to see if a player's location is within the specified conversation area
   * 
   * This method is resilient to floating point errors that could arise if any of the coordinates of
   * `this.location` are dramatically smaller than those of the conversation area's bounding box.
   * @param conversation 
   * @returns 
   */


  isWithin(conversation: ServerConversationArea): boolean {
    if (stryMutAct_9fa48("106")) {
      {}
    } else {
      stryCov_9fa48("106");
      return stryMutAct_9fa48("109") ? this.location.x > conversation.boundingBox.x - conversation.boundingBox.width / 2 && this.location.x < conversation.boundingBox.x + conversation.boundingBox.width / 2 && this.location.y > conversation.boundingBox.y - conversation.boundingBox.height / 2 || this.location.y < conversation.boundingBox.y + conversation.boundingBox.height / 2 : stryMutAct_9fa48("108") ? false : stryMutAct_9fa48("107") ? true : (stryCov_9fa48("107", "108", "109"), (stryMutAct_9fa48("111") ? this.location.x > conversation.boundingBox.x - conversation.boundingBox.width / 2 && this.location.x < conversation.boundingBox.x + conversation.boundingBox.width / 2 || this.location.y > conversation.boundingBox.y - conversation.boundingBox.height / 2 : stryMutAct_9fa48("110") ? true : (stryCov_9fa48("110", "111"), (stryMutAct_9fa48("113") ? this.location.x > conversation.boundingBox.x - conversation.boundingBox.width / 2 || this.location.x < conversation.boundingBox.x + conversation.boundingBox.width / 2 : stryMutAct_9fa48("112") ? true : (stryCov_9fa48("112", "113"), (stryMutAct_9fa48("116") ? this.location.x <= conversation.boundingBox.x - conversation.boundingBox.width / 2 : stryMutAct_9fa48("115") ? this.location.x >= conversation.boundingBox.x - conversation.boundingBox.width / 2 : stryMutAct_9fa48("114") ? true : (stryCov_9fa48("114", "115", "116"), this.location.x > (stryMutAct_9fa48("117") ? conversation.boundingBox.x + conversation.boundingBox.width / 2 : (stryCov_9fa48("117"), conversation.boundingBox.x - (stryMutAct_9fa48("118") ? conversation.boundingBox.width * 2 : (stryCov_9fa48("118"), conversation.boundingBox.width / 2)))))) && (stryMutAct_9fa48("121") ? this.location.x >= conversation.boundingBox.x + conversation.boundingBox.width / 2 : stryMutAct_9fa48("120") ? this.location.x <= conversation.boundingBox.x + conversation.boundingBox.width / 2 : stryMutAct_9fa48("119") ? true : (stryCov_9fa48("119", "120", "121"), this.location.x < (stryMutAct_9fa48("122") ? conversation.boundingBox.x - conversation.boundingBox.width / 2 : (stryCov_9fa48("122"), conversation.boundingBox.x + (stryMutAct_9fa48("123") ? conversation.boundingBox.width * 2 : (stryCov_9fa48("123"), conversation.boundingBox.width / 2)))))))) && (stryMutAct_9fa48("126") ? this.location.y <= conversation.boundingBox.y - conversation.boundingBox.height / 2 : stryMutAct_9fa48("125") ? this.location.y >= conversation.boundingBox.y - conversation.boundingBox.height / 2 : stryMutAct_9fa48("124") ? true : (stryCov_9fa48("124", "125", "126"), this.location.y > (stryMutAct_9fa48("127") ? conversation.boundingBox.y + conversation.boundingBox.height / 2 : (stryCov_9fa48("127"), conversation.boundingBox.y - (stryMutAct_9fa48("128") ? conversation.boundingBox.height * 2 : (stryCov_9fa48("128"), conversation.boundingBox.height / 2)))))))) && (stryMutAct_9fa48("131") ? this.location.y >= conversation.boundingBox.y + conversation.boundingBox.height / 2 : stryMutAct_9fa48("130") ? this.location.y <= conversation.boundingBox.y + conversation.boundingBox.height / 2 : stryMutAct_9fa48("129") ? true : (stryCov_9fa48("129", "130", "131"), this.location.y < (stryMutAct_9fa48("132") ? conversation.boundingBox.y - conversation.boundingBox.height / 2 : (stryCov_9fa48("132"), conversation.boundingBox.y + (stryMutAct_9fa48("133") ? conversation.boundingBox.height * 2 : (stryCov_9fa48("133"), conversation.boundingBox.height / 2)))))));
    }
  }

}