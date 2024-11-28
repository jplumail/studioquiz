### Run locally

```
gcloud components install pubsub-emulator
gcloud beta emulators pubsub start --project=studioquiz
$(gcloud beta emulators pubsub env-init)
```

```
npm run dev
```

### TODO

- [x] start game command
- [x] generate question and send to clients
- [x] detect if answer is correct
- [x] go to next question when timer is over
- [x] move from redis to google pub/sub
- [x] implement server-side rooms
- [ ] choose pseudo
- [ ] create use from client, share with link