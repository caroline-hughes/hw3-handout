import CORS from 'cors';
import Express from 'express';
import http from 'http';
import { nanoid } from 'nanoid';
import { AddressInfo } from 'net';
import { mock, mockReset } from 'jest-mock-extended';
import CoveyTownController from '../lib/CoveyTownController';
import CoveyTownsStore from '../lib/CoveyTownsStore';
import addTownRoutes from '../router/towns';
import * as requestHandlers from '../requestHandlers/CoveyTownRequestHandlers';
import { createConversationForTesting } from './TestUtils';
import TownsServiceClient, { ServerConversationArea } from './TownsServiceClient';
import PlayerSession from '../types/PlayerSession';
import Player from '../types/Player';

type TestTownData = {
  friendlyName: string;
  coveyTownID: string;
  isPubliclyListed: boolean;
  townUpdatePassword: string;
};

describe('Create Conversation Area API', () => {
  let server: http.Server;
  let apiClient: TownsServiceClient;

  async function createTownForTesting(
    friendlyNameToUse?: string,
    isPublic = false,
  ): Promise<TestTownData> {
    const friendlyName =
      friendlyNameToUse !== undefined
        ? friendlyNameToUse
        : `${isPublic ? 'Public' : 'Private'}TestingTown=${nanoid()}`;
    const ret = await apiClient.createTown({
      friendlyName,
      isPubliclyListed: isPublic,
    });
    return {
      friendlyName,
      isPubliclyListed: isPublic,
      coveyTownID: ret.coveyTownID,
      townUpdatePassword: ret.coveyTownPassword,
    };
  }

  beforeAll(async () => {
    const app = Express();
    app.use(CORS());
    server = http.createServer(app);

    addTownRoutes(server, app);
    await server.listen();
    const address = server.address() as AddressInfo;

    apiClient = new TownsServiceClient(`http://127.0.0.1:${address.port}`);
  });
  afterAll(async () => {
    await server.close();
  });
  it('Executes without error when creating a new conversation', async () => {
    const testingTown = await createTownForTesting(undefined, true);
    const testingSession = await apiClient.joinTown({
      userName: nanoid(),
      coveyTownID: testingTown.coveyTownID,
    });
    await apiClient.createConversationArea({
      conversationArea: createConversationForTesting(),
      coveyTownID: testingTown.coveyTownID,
      sessionToken: testingSession.coveySessionToken,
    });
  });
});


describe('conversationAreaCreateHandler', () => {

  const mockCoveyTownStore = mock<CoveyTownsStore>();
  const mockCoveyTownController = mock<CoveyTownController>();
  beforeAll(() => {
    // Set up a spy for CoveyTownsStore that will always return our mockCoveyTownsStore as the singleton instance
    jest.spyOn(CoveyTownsStore, 'getInstance').mockReturnValue(mockCoveyTownStore);
  });
  beforeEach(() => {
    // Reset all mock calls, and ensure that getControllerForTown will always return the same mock controller
    mockReset(mockCoveyTownController);
    mockReset(mockCoveyTownStore);
    mockCoveyTownStore.getControllerForTown.mockReturnValue(mockCoveyTownController);
  });
  it('Checks for a valid session token before creating a conversation area', ()=>{
    const coveyTownID = nanoid();
    const conversationArea :ServerConversationArea = { boundingBox: { height: 1, width: 1, x:1, y:1 }, label: nanoid(), occupantsByID: [], topic: nanoid() };

    // Make sure to return 'undefined' regardless of what session token is passed
    mockCoveyTownController.getSessionByToken.mockReturnValueOnce(undefined);

    const res = requestHandlers.conversationAreaCreateHandler({
      conversationArea,
      coveyTownID,
      sessionToken: 'randomString',
    });
    expect(mockCoveyTownController.addConversationArea).not.toHaveBeenCalled();
    expect(res.isOK).toBeFalsy();
    expect(res.message).toEqual(`Unable to create conversation area ${conversationArea.label} with topic ${conversationArea.topic}`);
  });
  it('Returns no error message when successfully adding a conversation area', ()=>{
    const coveyTownID = nanoid();
    const conversationArea : ServerConversationArea = createConversationForTesting();
    const player: Player = new Player(nanoid());
    const validSession: PlayerSession = new PlayerSession(player);

    mockCoveyTownController.getSessionByToken.mockReturnValueOnce(validSession);
    mockCoveyTownController.addConversationArea.mockReturnValueOnce(true);

    const res = requestHandlers.conversationAreaCreateHandler({
      conversationArea,
      coveyTownID,
      sessionToken: 'randomString',
    });

    expect(mockCoveyTownController.addConversationArea).toHaveBeenCalled();
    expect(res.isOK).toBeTruthy();
    expect(res.message).toBeFalsy();
  });
  it('Returns the correct error message when failing to add a conversation area', ()=>{
    const coveyTownID = nanoid();
    const conversationArea : ServerConversationArea = createConversationForTesting();
    const player: Player = new Player(nanoid());
    const validSession: PlayerSession = new PlayerSession(player);

    mockCoveyTownController.getSessionByToken.mockReturnValueOnce(validSession);
    mockCoveyTownController.addConversationArea.mockReturnValueOnce(false);

    const res = requestHandlers.conversationAreaCreateHandler({
      conversationArea,
      coveyTownID,
      sessionToken: 'randomString',
    });

    expect(mockCoveyTownController.addConversationArea).toHaveBeenCalled();
    expect(res.isOK).toBeFalsy();
    expect(res.message).toEqual(`Unable to create conversation area ${conversationArea.label} with topic ${conversationArea.topic}`);
  });
});