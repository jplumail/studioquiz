```
gcloud components install pubsub-emulator
gcloud beta emulators pubsub start --project=studioquiz
$(gcloud beta emulators pubsub env-init)
npm run dev-cluster
```