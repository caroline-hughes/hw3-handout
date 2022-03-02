import { nanoid } from 'nanoid';
import { mock, mockDeep, mockReset } from 'jest-mock-extended';
import { Socket } from 'socket.io';
import TwilioVideo from './TwilioVideo';
import Player from '../types/Player';
import CoveyTownController from './CoveyTownController';
import CoveyTownListener from '../types/CoveyTownListener';
import { UserLocation } from '../CoveyTypes';
import PlayerSession from '../types/PlayerSession';
import { townSubscriptionHandler } from '../requestHandlers/CoveyTownRequestHandlers';
import CoveyTownsStore from './CoveyTownsStore';
import {
  createConversationForTesting,
  locInConversation,
  nonConversationAreaLoc,
  setSessionTokenAndTownID,
  anotherLocInConversation,
  createUserLocation,
} from '../client/TestUtils';

const mockTwilioVideo = mockDeep<TwilioVideo>();
jest.spyOn(TwilioVideo, 'getInstance').mockReturnValue(mockTwilioVideo);

function generateTestLocation(): UserLocation {
  return {
    rotation: 'back',
    moving: Math.random() < 0.5,
    x: Math.floor(Math.random() * 100),
    y: Math.floor(Math.random() * 100),
  };
}

describe('CoveyTownController', () => {
  beforeEach(() => {
    mockTwilioVideo.getTokenForTown.mockClear();
  });
  it('constructor should set the friendlyName property', () => {
    const townName = `FriendlyNameTest-${nanoid()}`;
    const townController = new CoveyTownController(townName, false);
    expect(townController.friendlyName).toBe(townName);
  });
  describe('addPlayer', () => {
    it('should use the coveyTownID and player ID properties when requesting a video token', async () => {
      const townName = `FriendlyNameTest-${nanoid()}`;
      const townController = new CoveyTownController(townName, false);
      const newPlayerSession = await townController.addPlayer(new Player(nanoid()));
      expect(mockTwilioVideo.getTokenForTown).toBeCalledTimes(1);
      expect(mockTwilioVideo.getTokenForTown).toBeCalledWith(
        townController.coveyTownID,
        newPlayerSession.player.id,
      );
    });
  });
  describe('town listeners and events', () => {
    let testingTown: CoveyTownController;
    const mockListeners = [
      mock<CoveyTownListener>(),
      mock<CoveyTownListener>(),
      mock<CoveyTownListener>(),
    ];
    beforeEach(() => {
      const townName = `town listeners and events tests ${nanoid()}`;
      testingTown = new CoveyTownController(townName, false);
      mockListeners.forEach(mockReset);
    });
    it('should notify added listeners of player movement when updatePlayerLocation is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);
      const newLocation = generateTestLocation();
      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      testingTown.updatePlayerLocation(player, newLocation);
      mockListeners.forEach(listener => expect(listener.onPlayerMoved).toBeCalledWith(player));
    });
    it('should remove a player from conversation when their session is destroyed', async () => {
      const newConversationArea = createConversationForTesting({
        boundingBox: { x: 10, y: 10, height: 5, width: 5 },
      });
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);
      const player = new Player(nanoid());
      const session = await testingTown.addPlayer(player);
      const newLocation: UserLocation = {
        moving: false,
        rotation: 'front',
        x: 25,
        y: 25,
        conversationLabel: newConversationArea.label,
      };
      testingTown.updatePlayerLocation(player, newLocation);
      expect(newConversationArea.occupantsByID.length).toEqual(1);
      testingTown.destroySession(session);
      expect(newConversationArea.occupantsByID.length).toEqual(0);
    });
    it('should notify added listeners of player disconnections when destroySession is called', async () => {
      const player = new Player('test player');
      const session = await testingTown.addPlayer(player);

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      testingTown.destroySession(session);
      mockListeners.forEach(listener =>
        expect(listener.onPlayerDisconnected).toBeCalledWith(player),
      );
    });
    it('should notify added listeners of new players when addPlayer is called', async () => {
      mockListeners.forEach(listener => testingTown.addTownListener(listener));

      const player = new Player('test player');
      await testingTown.addPlayer(player);
      mockListeners.forEach(listener => expect(listener.onPlayerJoined).toBeCalledWith(player));
    });
    it('should notify added listeners that the town is destroyed when disconnectAllPlayers is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      testingTown.disconnectAllPlayers();
      mockListeners.forEach(listener => expect(listener.onTownDestroyed).toBeCalled());
    });
    it('should not notify removed listeners of player movement when updatePlayerLocation is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      const newLocation = generateTestLocation();
      const listenerRemoved = mockListeners[1];
      testingTown.removeTownListener(listenerRemoved);
      testingTown.updatePlayerLocation(player, newLocation);
      expect(listenerRemoved.onPlayerMoved).not.toBeCalled();
    });
    it('should not notify removed listeners of player disconnections when destroySession is called', async () => {
      const player = new Player('test player');
      const session = await testingTown.addPlayer(player);

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      const listenerRemoved = mockListeners[1];
      testingTown.removeTownListener(listenerRemoved);
      testingTown.destroySession(session);
      expect(listenerRemoved.onPlayerDisconnected).not.toBeCalled();
    });
    it('should not notify removed listeners of new players when addPlayer is called', async () => {
      const player = new Player('test player');

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      const listenerRemoved = mockListeners[1];
      testingTown.removeTownListener(listenerRemoved);
      const session = await testingTown.addPlayer(player);
      testingTown.destroySession(session);
      expect(listenerRemoved.onPlayerJoined).not.toBeCalled();
    });

    it('should not notify removed listeners that the town is destroyed when disconnectAllPlayers is called', async () => {
      const player = new Player('test player');
      await testingTown.addPlayer(player);

      mockListeners.forEach(listener => testingTown.addTownListener(listener));
      const listenerRemoved = mockListeners[1];
      testingTown.removeTownListener(listenerRemoved);
      testingTown.disconnectAllPlayers();
      expect(listenerRemoved.onTownDestroyed).not.toBeCalled();
    });
  });
  describe('townSubscriptionHandler', () => {
    const mockSocket = mock<Socket>();
    let testingTown: CoveyTownController;
    let player: Player;
    let session: PlayerSession;
    beforeEach(async () => {
      const townName = `connectPlayerSocket tests ${nanoid()}`;
      testingTown = CoveyTownsStore.getInstance().createTown(townName, false);
      mockReset(mockSocket);
      player = new Player('test player');
      session = await testingTown.addPlayer(player);
    });
    it('should reject connections with invalid town IDs by calling disconnect', async () => {
      setSessionTokenAndTownID(nanoid(), session.sessionToken, mockSocket);
      townSubscriptionHandler(mockSocket);
      expect(mockSocket.disconnect).toBeCalledWith(true);
    });
    it('should reject connections with invalid session tokens by calling disconnect', async () => {
      setSessionTokenAndTownID(testingTown.coveyTownID, nanoid(), mockSocket);
      townSubscriptionHandler(mockSocket);
      expect(mockSocket.disconnect).toBeCalledWith(true);
    });
    describe('with a valid session token', () => {
      it('should add a town listener, which should emit "newPlayer" to the socket when a player joins', async () => {
        setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        await testingTown.addPlayer(player);
        expect(mockSocket.emit).toBeCalledWith('newPlayer', player);
      });
      it('should add a town listener, which should emit "playerMoved" to the socket when a player moves', async () => {
        setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        testingTown.updatePlayerLocation(player, generateTestLocation());
        expect(mockSocket.emit).toBeCalledWith('playerMoved', player);
      });
      it('should add a town listener, which should emit "playerDisconnect" to the socket when a player disconnects', async () => {
        setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        testingTown.destroySession(session);
        expect(mockSocket.emit).toBeCalledWith('playerDisconnect', player);
      });
      it('should add a town listener, which should emit "townClosing" to the socket and disconnect it when disconnectAllPlayers is called', async () => {
        setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        testingTown.disconnectAllPlayers();
        expect(mockSocket.emit).toBeCalledWith('townClosing');
        expect(mockSocket.disconnect).toBeCalledWith(true);
      });
      describe('when a socket disconnect event is fired', () => {
        it('should remove the town listener for that socket, and stop sending events to it', async () => {
          setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
          townSubscriptionHandler(mockSocket);

          // find the 'disconnect' event handler for the socket, which should have been registered after the socket was connected
          const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect');
          if (disconnectHandler && disconnectHandler[1]) {
            disconnectHandler[1]();
            const newPlayer = new Player('should not be notified');
            await testingTown.addPlayer(newPlayer);
            expect(mockSocket.emit).not.toHaveBeenCalledWith('newPlayer', newPlayer);
          } else {
            fail('No disconnect handler registered');
          }
        });
        it('should destroy the session corresponding to that socket', async () => {
          setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
          townSubscriptionHandler(mockSocket);

          // find the 'disconnect' event handler for the socket, which should have been registered after the socket was connected
          const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect');
          if (disconnectHandler && disconnectHandler[1]) {
            disconnectHandler[1]();
            mockReset(mockSocket);
            setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
            townSubscriptionHandler(mockSocket);
            expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
          } else {
            fail('No disconnect handler registered');
          }
        });
      });
      it('should forward playerMovement events from the socket to subscribed listeners', async () => {
        setSessionTokenAndTownID(testingTown.coveyTownID, session.sessionToken, mockSocket);
        townSubscriptionHandler(mockSocket);
        const mockListener = mock<CoveyTownListener>();
        testingTown.addTownListener(mockListener);
        // find the 'playerMovement' event handler for the socket, which should have been registered after the socket was connected
        const playerMovementHandler = mockSocket.on.mock.calls.find(
          call => call[0] === 'playerMovement',
        );
        if (playerMovementHandler && playerMovementHandler[1]) {
          const newLocation = generateTestLocation();
          player.location = newLocation;
          playerMovementHandler[1](newLocation);
          expect(mockListener.onPlayerMoved).toHaveBeenCalledWith(player);
        } else {
          fail('No playerMovement handler registered');
        }
      });
    });
  });
  



  // UPDATE PLAYER LOCATION
  describe('updatePlayerLocation', () => {
    let testingTown: CoveyTownController;
    beforeEach(() => {
      const townName = `updatePlayerLocation test town ${nanoid()}`;
      testingTown = new CoveyTownController(townName, false);
    });
    it("should respect the conversation area reported by the player userLocation.conversationLabel, and not override it based on the player's x,y location", async () => {
      const newConversationArea = createConversationForTesting({
        boundingBox: { x: 10, y: 10, height: 5, width: 5 },
      });
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);
      const player = new Player(nanoid());
      await testingTown.addPlayer(player);

      const newLocation: UserLocation = {
        moving: false,
        rotation: 'front',
        x: 25,
        y: 25,
        conversationLabel: newConversationArea.label,
      };
      testingTown.updatePlayerLocation(player, newLocation);
      expect(player.activeConversationArea?.label).toEqual(newConversationArea.label);
      expect(player.activeConversationArea?.topic).toEqual(newConversationArea.topic);
      expect(player.activeConversationArea?.boundingBox).toEqual(newConversationArea.boundingBox);

      const areas = testingTown.conversationAreas;
      expect(areas[0].occupantsByID.length).toBe(1);
      expect(areas[0].occupantsByID[0]).toBe(player.id);
    });

    it('should not emit an onConversationUpdated event when a player doesn not enter a conversation', async () => {
      const mockListener = mock<CoveyTownListener>();
      testingTown.addTownListener(mockListener);

      const player = new Player(nanoid());
      await testingTown.addPlayer(player);
      expect(player.activeConversationArea).toBeFalsy();
      const newLocation: UserLocation = {
        moving: false,
        rotation: 'front',
        x: 25,
        y: 25,
      };
      testingTown.updatePlayerLocation(player, newLocation);
      expect(mockListener.onConversationAreaUpdated).toHaveBeenCalledTimes(0);
    });

    it('should emit onConversationUpdated whenever occupants enter, onConversationUpdated whenever a non-final occupant leaves, onConversationDestroyed when a final occupant leaves', async () => {
      const conversation = createConversationForTesting({
        boundingBox: { x: 10, y: 10, height: 5, width: 5 },
        conversationLabel: 'first',
      });
      testingTown.addConversationArea(conversation);

      const conversation2 = createConversationForTesting({
        boundingBox: { x: 100, y: 100, height: 5, width: 5 },
        conversationLabel: 'second',
      });
      testingTown.addConversationArea(conversation2);
      const mockListener = mock<CoveyTownListener>();
      testingTown.addTownListener(mockListener);

      const player1 = new Player(nanoid());
      await testingTown.addPlayer(player1);
      const player2 = new Player(nanoid());
      await testingTown.addPlayer(player2);
      const player2ID = player2.id;

      // a player moves around outside of any conversation
      testingTown.updatePlayerLocation(player1, nonConversationAreaLoc());
      expect(mockListener.onConversationAreaUpdated).toHaveBeenCalledTimes(0);
      expect(mockListener.onConversationAreaDestroyed).toHaveBeenCalledTimes(0);

      // two players move into a conversation
      testingTown.updatePlayerLocation(player1, locInConversation(conversation));
      testingTown.updatePlayerLocation(player2, locInConversation(conversation));
      expect(mockListener.onConversationAreaUpdated).toHaveBeenCalledTimes(2);

      // a player moves around inside the conversation
      testingTown.updatePlayerLocation(player1, anotherLocInConversation(conversation));
      expect(mockListener.onConversationAreaUpdated).toHaveBeenCalledTimes(2); // no change

      // one occupant leaves the conversation to go to another conversation
      testingTown.updatePlayerLocation(player1, locInConversation(conversation2));
      expect(mockListener.onConversationAreaUpdated).toHaveBeenCalledTimes(4); // two more updated calls

      // the other occupants follows them into the other conversation
      testingTown.updatePlayerLocation(player2, locInConversation(conversation2));
      expect(mockListener.onConversationAreaDestroyed).toHaveBeenCalledTimes(1); // first conv dies
      expect(mockListener.onConversationAreaUpdated).toHaveBeenCalledTimes(5); // sec is updated

      // one of them leaves for nowhere
      testingTown.updatePlayerLocation(player1, nonConversationAreaLoc());
      expect(mockListener.onConversationAreaUpdated).toHaveBeenCalledTimes(6); // sec is updated
      expect(mockListener.onConversationAreaDestroyed).toHaveBeenCalledTimes(1); // still someone in it
      expect(conversation2.occupantsByID.length).toEqual(1);
      expect(conversation2.occupantsByID[0]).toEqual(player2ID);

      expect(testingTown.conversationAreas.length).toEqual(1);
      expect(testingTown.conversationAreas[0].label).toEqual('second');

      // the final occupant leaves the conversation
      testingTown.updatePlayerLocation(player2, nonConversationAreaLoc());
      expect(mockListener.onConversationAreaUpdated).toHaveBeenCalledTimes(6); // no change
      expect(mockListener.onConversationAreaDestroyed).toHaveBeenCalledTimes(2); // sec conv dies
      expect(conversation2.occupantsByID.length).toEqual(0);

      expect(testingTown.conversationAreas.length).toEqual(0);
    });

    it('Gets the last case for occupants array', async () => {
      const conversation = createConversationForTesting({
        boundingBox: { x: 10, y: 10, height: 5, width: 5 },
        conversationLabel: 'first',
      });
      testingTown.addConversationArea(conversation);

      const conversation2 = createConversationForTesting({
        boundingBox: { x: 100, y: 100, height: 5, width: 5 },
        conversationLabel: 'second',
      });
      testingTown.addConversationArea(conversation2);
      const mockListener = mock<CoveyTownListener>();
      testingTown.addTownListener(mockListener);

      const player1 = new Player(nanoid());
      await testingTown.addPlayer(player1);
      const player1ID = player1.id;

      const player2 = new Player(nanoid());
      await testingTown.addPlayer(player2);

      // two players move into a conversation
      testingTown.updatePlayerLocation(player1, locInConversation(conversation));
      testingTown.updatePlayerLocation(player2, locInConversation(conversation));
      expect(mockListener.onConversationAreaUpdated).toHaveBeenCalledTimes(2);

      // one occupant leaves the conversation to go to another conversation
      testingTown.updatePlayerLocation(player2, locInConversation(conversation2));
      expect(mockListener.onConversationAreaUpdated).toHaveBeenCalledTimes(4); // two more updated calls
      expect(conversation.occupantsByID.length).toEqual(1);
      expect(conversation.occupantsByID[0]).toEqual(player1ID);
    });

    it('Gets the last case for conversations array', async () => {
      const conversation = createConversationForTesting({
        boundingBox: { x: 10, y: 10, height: 5, width: 5 },
        conversationLabel: 'first',
      });
      testingTown.addConversationArea(conversation);

      const conversation2 = createConversationForTesting({
        boundingBox: { x: 100, y: 100, height: 5, width: 5 },
        conversationLabel: 'second',
      });
      testingTown.addConversationArea(conversation2);
      const mockListener = mock<CoveyTownListener>();
      testingTown.addTownListener(mockListener);

      const player1 = new Player(nanoid());
      await testingTown.addPlayer(player1);

      const player2 = new Player(nanoid());
      await testingTown.addPlayer(player2);

      // player1 is in conversation
      testingTown.updatePlayerLocation(player1, locInConversation(conversation));
      // player2 is in conversation2
      testingTown.updatePlayerLocation(player2, locInConversation(conversation2));

      // player 2 leaves conversation2, causing it to be destroyed
      testingTown.updatePlayerLocation(player2, nonConversationAreaLoc());
      expect(mockListener.onConversationAreaDestroyed).toHaveBeenCalledTimes(1);

      expect(testingTown.conversationAreas[0].label).toEqual('first');
    });
  });



  // ADD CONVERSATION AREA
  describe('addConversationArea', () => {
    let testingTown: CoveyTownController;
    beforeEach(() => {
      const townName = `addConversationArea test town ${nanoid()}`;
      testingTown = new CoveyTownController(townName, false);
    });
    it('should add the conversation area to the list of conversation areas', () => {
      expect(testingTown.conversationAreas.length).toEqual(0);

      const newConversationArea = createConversationForTesting();
      const result = testingTown.addConversationArea(newConversationArea);
      expect(result).toBe(true);

      const areas = testingTown.conversationAreas;
      expect(areas.length).toEqual(1);
      expect(areas[0].label).toEqual(newConversationArea.label);
      expect(areas[0].topic).toEqual(newConversationArea.topic);
      expect(areas[0].boundingBox).toEqual(newConversationArea.boundingBox);
      expect(areas[0].occupantsByID.length).toEqual(0);
    });

    it('returns false when trying to create a conversation with no topic', async () => {
      const conversation = createConversationForTesting({
        noTopic: true,
      });
      const result = testingTown.addConversationArea(conversation);
      expect(result).toBe(false);
    });

    it('returns false when trying to create a conversation whose label matches one that already exists', async () => {
      const conversation = createConversationForTesting({
        boundingBox: { x: 10, y: 10, height: 5, width: 5 },
        conversationLabel: 'carolinesConvo',
      });
      const result1 = testingTown.addConversationArea(conversation);
      expect(result1).toBe(true);


      const conversation2 = createConversationForTesting({
        boundingBox: { x: 100, y: 100, height: 5, width: 5 },
        conversationLabel: 'carolinesConvo',
      });
      const result2 = testingTown.addConversationArea(conversation2);
      expect(result2).toBe(false);
      expect(testingTown.conversationAreas.length).toEqual(1);
    });

    it('returns false when trying to create a conversation which overlaps the bounding box of an existing one', async () => {
      const conversation = createConversationForTesting({
        boundingBox: { x: 10, y: 10, height: 5, width: 5 },
      });
      const result1 = testingTown.addConversationArea(conversation);
      expect(result1).toBe(true);


      const conversation2 = createConversationForTesting({
        boundingBox: { x: 10, y: 10, height: 5, width: 5 },
      });
      const result2 = testingTown.addConversationArea(conversation2);
      expect(result2).toBe(false);
    });

    it('returns true when creating a conversation with a defined topic, a unique label, and a non-overlapping bounding box', async () => {
      const conversation = createConversationForTesting({
        boundingBox: { x: 10, y: 10, height: 5, width: 5 },
        conversationLabel: 'applesConvo1',
        conversationTopic: 'apples',
      });
      const result1 = testingTown.addConversationArea(conversation);
      expect(result1).toBe(true);

      const conversation2 = createConversationForTesting({
        boundingBox: { x: 100, y: 100, height: 5, width: 5 },
        conversationLabel: 'applesConvo2',
        conversationTopic: 'apples',
      });
      const result2 = testingTown.addConversationArea(conversation2);
      expect(result2).toBe(true);

      expect(conversation2.label).toEqual('applesConvo2');
      expect(conversation2.topic).toEqual('apples');
    });

    it('adds players inside the bounding box to the occupants list and updates their active conversation field', async () => {
      const mockListener = mock<CoveyTownListener>();
      testingTown.addTownListener(mockListener);

      const playerOutside = new Player(nanoid());
      await testingTown.addPlayer(playerOutside);
      testingTown.updatePlayerLocation(playerOutside, nonConversationAreaLoc());
      expect(playerOutside.activeConversationArea).toBeFalsy();

      const playerInQ1 = new Player(nanoid());
      await testingTown.addPlayer(playerInQ1);
      testingTown.updatePlayerLocation(playerInQ1, createUserLocation(399, 401));

      const playerInQ2 = new Player(nanoid());
      await testingTown.addPlayer(playerInQ2);
      testingTown.updatePlayerLocation(playerInQ2, createUserLocation(401, 401));

      const playerInQ3 = new Player(nanoid());
      await testingTown.addPlayer(playerInQ3);
      testingTown.updatePlayerLocation(playerInQ3, createUserLocation(399, 399));

      const playerInQ4 = new Player(nanoid());
      await testingTown.addPlayer(playerInQ4);
      testingTown.updatePlayerLocation(playerInQ4, createUserLocation(401, 399));

      const conversation = createConversationForTesting();
      testingTown.addConversationArea(conversation);

      expect(mockListener.onConversationAreaUpdated).toHaveBeenCalledTimes(1);
      const areas = testingTown.conversationAreas;
      expect(areas.length).toEqual(1);
      expect(areas[0].occupantsByID.length).toEqual(4);
      expect(playerOutside.activeConversationArea).toBeFalsy();
      expect(playerInQ1.activeConversationArea).toEqual(conversation);
      expect(playerInQ2.activeConversationArea).toEqual(conversation);
      expect(playerInQ3.activeConversationArea).toEqual(conversation);
      expect(playerInQ4.activeConversationArea).toEqual(conversation);
    });
  });

});
