### Install

```
pnpm install
```

### Run locally

Launch game server:
```
gcloud components install pubsub-emulator
gcloud beta emulators pubsub start --project=studioquiz
$(gcloud beta emulators pubsub env-init)
cd game-server
pnpm dev
```

Launch Next app:
```
cd next-app
pnpm dev
```

### TODO

- [x] start game command
- [x] generate question and send to clients
- [x] detect if answer is correct
- [x] go to next question when timer is over
- [x] move from redis to google pub/sub
- [x] implement server-side rooms
- [x] choose pseudo
- [x] create room from client, share with link, join the room
- [x] separate gameserver/website
- [x] fix mobile display
- [x] generate questions
- [x] passer par create room pour créer les rooms, interdire la connexion sinon
- [ ] joining room fails when server is cold
- [ ] questions database
- [ ] restart game easily