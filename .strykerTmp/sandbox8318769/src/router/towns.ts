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

import express, { Express } from 'express';
import io from 'socket.io';
import { Server } from 'http';
import { StatusCodes } from 'http-status-codes';
import { conversationAreaCreateHandler, townCreateHandler, townDeleteHandler, townJoinHandler, townListHandler, townSubscriptionHandler, townUpdateHandler } from '../requestHandlers/CoveyTownRequestHandlers';
import { logError } from '../Utils';
export default function addTownRoutes(http: Server, app: Express): io.Server {
  /*
   * Create a new session (aka join a town)
   */
  app.post('/sessions', express.json(), async (req, res) => {
    try {
      const result = await townJoinHandler({
        userName: req.body.userName,
        coveyTownID: req.body.coveyTownID
      });
      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      logError(err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Internal server error, please see log in server for more details'
      });
    }
  });
  /**
   * Delete a town
   */

  app.delete('/towns/:townID/:townPassword', express.json(), async (req, res) => {
    try {
      const result = townDeleteHandler({
        coveyTownID: req.params.townID,
        coveyTownPassword: req.params.townPassword
      });
      res.status(200).json(result);
    } catch (err) {
      logError(err);
      res.status(500).json({
        message: 'Internal server error, please see log in server for details'
      });
    }
  });
  /**
   * List all towns
   */

  app.get('/towns', express.json(), async (_req, res) => {
    try {
      const result = townListHandler();
      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      logError(err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Internal server error, please see log in server for more details'
      });
    }
  });
  /**
   * Create a town
   */

  app.post('/towns', express.json(), async (req, res) => {
    try {
      const result = townCreateHandler(req.body);
      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      logError(err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Internal server error, please see log in server for more details'
      });
    }
  });
  /**
   * Update a town
   */

  app.patch('/towns/:townID', express.json(), async (req, res) => {
    try {
      const result = townUpdateHandler({
        coveyTownID: req.params.townID,
        isPubliclyListed: req.body.isPubliclyListed,
        friendlyName: req.body.friendlyName,
        coveyTownPassword: req.body.coveyTownPassword
      });
      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      logError(err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Internal server error, please see log in server for more details'
      });
    }
  });
  app.post('/towns/:townID/conversationAreas', express.json(), async (req, res) => {
    try {
      if (stryMutAct_9fa48("101")) {
        {}
      } else {
        stryCov_9fa48("101");
        const result = await conversationAreaCreateHandler(stryMutAct_9fa48("102") ? {} : (stryCov_9fa48("102"), {
          coveyTownID: req.params.townID,
          sessionToken: req.body.sessionToken,
          conversationArea: req.body.conversationArea
        }));
        res.status(StatusCodes.OK).json(result);
      }
    } catch (err) {
      if (stryMutAct_9fa48("103")) {
        {}
      } else {
        stryCov_9fa48("103");
        logError(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(stryMutAct_9fa48("104") ? {} : (stryCov_9fa48("104"), {
          message: stryMutAct_9fa48("105") ? "" : (stryCov_9fa48("105"), 'Internal server error, please see log in server for more details')
        }));
      }
    }
  });
  const socketServer = new io.Server(http, {
    cors: {
      origin: '*'
    }
  });
  socketServer.on('connection', townSubscriptionHandler);
  return socketServer;
}