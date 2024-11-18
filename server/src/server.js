// @ts-check
/**
 * @import { Scores, Player, Score } from '../../shared/declarations';
 * @import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from '../../shared/declarations';
 */

/**
 * @readonly
 * @enum {string}
 */
var State = {
  LOBBY: "LOBBY",
  FINISHED: "FINISHED",
  WAITING: "WAITING",
  QUESTION: "QUESTION",
}

import { Server as SocketIOServer, Socket as SocketIOSocket } from 'socket.io';
import http from 'http';

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

const placeholderQuestions = [
  "What is the capital of France?",
  "What is the capital of Germany?",
  "What is the capital of Italy?",
]

const placeholderAnswers = [
  "Paris",
  "Berlin",
  "Rome",
]

const pointsArray = [4, 3, 3, 2, 1, 1, 1, 1];

/**
 * @typedef {SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>} SocketServer
 * @typedef {SocketIOSocket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>} Socket
 */

class Server {
  /**
   * @param {http.Server} httpServer
   */
  constructor(httpServer) {

    var origin = production ? "https://example.com" : "http://localhost:3000";
    /** @type {SocketServer} */
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: origin,
        methods: ["GET", "POST"]
      }
    
    });
    /** @type {Scores} */
    this.scores = new Map();
    /** @type {Map<Socket, Player>} */
    this.registeredPlayers = new Map();
    this.countdown = 10;  // 10 seconds

    /** 
     * @type {{
     *  scores: Scores,
     *  currentIndex: number,
     *  questions: string[],
     *  answers: string[],
     *  hasAnswered: Map<Player, boolean>,
     *  state: State,
     * }}
    */
    this.game = {
      scores: this.scores,
      currentIndex: 0,
      questions: placeholderQuestions,
      answers: placeholderAnswers,
      hasAnswered: new Map(),
      state: State.LOBBY,
    };

    this.io.on('connection', (socket) => {
        console.log('Client connected');
        socket.emit('scores', Object.fromEntries(this.scores));
        socket.on('registerPlayer', (player) => {
          // @ts-ignore
          this.scores.set(player, 0)
          this.registeredPlayers.set(socket, player);
          this.sendScores();
        });

        socket.on('playerMessage', (player, string) => this.handlePlayerMessage(player, string));
        socket.on('askStartGame', () => this.startGame());
        socket.on('disconnect', () => this.unregisterClient(socket));
    });
  }


  /**
   * Unregisters a client.
   * @param {Socket} socket
   */
  unregisterClient(socket) {
    const player = this.registeredPlayers.get(socket);
    if (player) {
      this.registeredPlayers.delete(socket);
      this.scores.delete(player);
      this.sendScores();
    }
    console.log('Client disconnected');
  }

  startGame() {
    this.io.emit('startGame');
    this.game.currentIndex = -1;
    this.game.state = 'PLAYING';
    this.nextQuestion();
  }

  nextQuestion() {
    if (this.game.currentIndex !== null) {
      this.game.currentIndex++;
      if (this.game.currentIndex >= this.game.questions.length) {
        this.endGame();
        return;
      }
      this.game.hasAnswered.forEach((_, key) => this.game.hasAnswered.set(key, false));
      console.log("Sending question: this.game.currentIndex", this.game.currentIndex);
      // @ts-ignore
      this.io.emit('startQuestion', this.game.questions[this.game.currentIndex], this.game.currentIndex + 1, Date.now() + this.countdown * 1000);
      this.game.state = 'QUESTION';
      setTimeout(() => this.endQuestion(), this.countdown * 1000);

    }
  }

  endQuestion() {
    if (this.game.currentIndex !== null) {
      this.game.state = 'WAITO';
      // @ts-ignore
      this.io.emit('endQuestion', this.game.answers[this.game.currentIndex]);
      setTimeout(() => this.nextQuestion(), 5000);
    }
  }

  endGame() {
    this.io.emit('endGame');
    this.game.state = 'FINISHED';
  }

  /**
   * Handles incoming messages from players.
   * @param {Player} player
   * @param {string} message
   */
  handlePlayerMessage(player, message) {
    if (this.game.state == State.QUESTION) {
      if (!this.game.hasAnswered.get(player)) {
        if ((this.game.currentIndex >= 0) && (this.game.currentIndex < this.game.answers.length) && this.checkAnswer(message, this.game.answers[this.game.currentIndex])) {
          const score = this.scores.get(player);
          if (score !== undefined) {
            // find the number of players who have answered correctly
            let numCorrect = 0;
            this.game.hasAnswered.forEach((value) => {
              if (value) {
                numCorrect++;
              }
            });
            const pointsGained = pointsArray[numCorrect];
            // @ts-ignore
            this.scores.set(player, score + pointsGained);
            this.sendScores();
            this.io.emit('correctAnswer', player, pointsGained);
            this.game.hasAnswered.set(player, true);
          }
        }
      }
      if (!this.game.hasAnswered.get(player)) {
        this.io.emit('playerMessage', player, message);
      }
    } else {
      this.io.emit('playerMessage', player, message);
    }
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
    this.io.emit('scores', Object.fromEntries(this.scores));
  }

}

const server = new Server(httpServer);