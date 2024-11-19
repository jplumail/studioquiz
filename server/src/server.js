// @ts-check
/**
 * @import { Player, GameState, Question, Answer, DateMilliseconds, Score } from '../../shared/declarations';
 * @import { Socket, SocketServer } from '../../shared/declarations';
 */

import { Server as SocketIOServer } from 'socket.io';
import http from 'http';
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

const pubClient = createClient({ url: "redis://localhost:6379" });
const subClient = pubClient.duplicate();

await Promise.all([
  pubClient.connect(),
  subClient.connect()
]);

const port = process.env.PORT || 8080;
const production = process.env.NODE_ENV === 'production';

// Create an HTTP server

const httpServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
});

httpServer.listen(port, () => {
  console.log(`HTTP server is running on port ${port}`);
});

/**
 * @type {Question[]}
 */
// @ts-ignore
const placeholderQuestions = ["What is the capital of France?", "What is the capital of Germany?","What is the capital of Italy?",]

/**
 * @type {Answer[]}
 */
// @ts-ignore
const placeholderAnswers = ["Paris","Berlin","Rome"]

const pointsArray = [4, 3, 3, 2, 1, 1, 1, 1];

/**
 * @type {DateMilliseconds}
 */
// @ts-ignore
const countdown = 10 * 1000;  // 10 seconds

/**
 * @returns {DateMilliseconds}
 */
function getCurrentTime() {
  // @ts-ignore
  return Date.now();
}


class GameServer {
  /**
   * @param {http.Server} httpServer
   */
  constructor(httpServer) {

    var origin = production ? "https://example.com" : "http://localhost:3000";
    /** @type {SocketServer} */
    this.io = new SocketIOServer(httpServer, {
      adapter: createAdapter(pubClient, subClient),
      cors: {
        origin: origin,
        methods: ["GET", "POST"]
      }
    });

    /** @type {GameState} */
    this.game = {
      scores: {},
      currentIndex: 0,
      questions: placeholderQuestions,
      answers: placeholderAnswers,
      hasAnswered: {},
      status: "LOBBY",
      registeredPlayers: {},
    }

    this.io.on('gameState', (newState) => {
      console.log('Received game state');
      this.game = newState;
    })

    this.io.on('connection', (socket) => {
      socket.id
        console.log('Client connected');
        socket.emit('scores', this.game.scores);
        socket.on('registerPlayer', (player) => {
          // @ts-ignore
          this.game.scores[player] = 0;
          this.game.registeredPlayers[socket.id] = player;
          this.updateGame();
          this.sendScores();
        });

        socket.on('playerMessage', (player, string) => this.handlePlayerMessage(player, string));
        socket.on('askStartGame', () => this.startGame());
        socket.on('disconnect', () => this.unregisterClient(socket));
    });
  }

  updateGame() {
    this.io.serverSideEmit('gameState', this.game);
  }


  /**
   * Unregisters a client.
   * @param {Socket} socket
   */
  unregisterClient(socket) {
    const player = this.game.registeredPlayers[socket.id];
    if (player) {
      delete this.game.registeredPlayers[socket.id];
      delete this.game.scores[player];
      this.sendScores();
      this.updateGame()
    }
    console.log('Client disconnected');
  }

  startGame() {
    this.io.emit('startGame');
    this.game.currentIndex = -1;
    this.game.status = 'WAITING';
    this.nextQuestion();
    this.updateGame();
  }

  nextQuestion() {
    if (this.game.currentIndex !== null) {
      this.game.currentIndex++;
      if (this.game.currentIndex >= this.game.questions.length) {
        this.endGame();
        this.updateGame();
        return;
      }
      this.game.hasAnswered = Object.keys(this.game.registeredPlayers).reduce((acc, player) => {
        acc[player] = false;
        return acc;
      }, {});
      
      /** @type {DateMilliseconds} */
      // @ts-ignore
      const endTime = getCurrentTime() + countdown
      this.io.emit('startQuestion', this.game.questions[this.game.currentIndex], this.game.currentIndex + 1, endTime);
      this.game.status = 'QUESTION';
      this.updateGame();
      setTimeout(() => this.endQuestion(), countdown);
    }
  }

  endQuestion() {
    if (this.game.currentIndex !== null) {
      this.game.status = 'WAITING';
      
      this.io.emit('endQuestion', this.game.answers[this.game.currentIndex]);
      this.updateGame();
      setTimeout(() => this.nextQuestion(), 5000);
    }
  }

  endGame() {
    this.io.emit('endGame');
    this.game.status = 'FINISHED';
    this.updateGame();
  }

  /**
   * Handles incoming messages from players.
   * @param {Player} player
   * @param {string} message
   */
  handlePlayerMessage(player, message) {
    if (this.game.status == 'QUESTION') {
      
      if (!this.game.hasAnswered[player]) {
        if ((this.game.currentIndex >= 0) && (this.game.currentIndex < this.game.answers.length) && this.checkAnswer(message, this.game.answers[this.game.currentIndex])) {
          
          const score = this.game.scores[player];
          if (score !== undefined) {
            // find the number of players who have answered correctly
            const numCorrect = Object.values(this.game.hasAnswered).filter(value => value).length;
            /** @type {Score} */
            // @ts-ignore
            const newScore = score + pointsArray[numCorrect];
            this.game.scores[player] = newScore;
            this.sendScores();
            this.io.emit('correctAnswer', player, pointsArray[numCorrect]);
            
            this.game.hasAnswered[player] = true;
          }
        }
      }
      
      if (!this.game.hasAnswered[player]) {
        this.io.emit('playerMessage', player, message);
      }
    } else {
      this.io.emit('playerMessage', player, message);
    }
    this.updateGame();
  }

  /**
   * Checks if attempt is correct
   * @param {string} attempt
   * @param {string} answer
   */
  checkAnswer(attempt, answer) {
    return attempt.toLowerCase() === answer.toLowerCase()
  }

  /**
   * Sends the current scores to all connected clients.
   */
  sendScores() {
    
    this.io.emit('scores', this.game.scores);
  }

}


const server = new GameServer(httpServer);