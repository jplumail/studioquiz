### Install

```
pnpm install
```

### Run locally

Install gcloud and pubsub-emulator:
```
gcloud components install pubsub-emulator
```

Install [mitdump](https://docs.mitmproxy.org/).

Launch project:
```
pnpm run -r dev
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
- [x] joining room fails when server is cold
- [ ] questions database
- [x] restart game easily
- [ ] lien généré par create game en prod ne sont pas bon
- [ ] faire la page /jouer
- [ ] faire un login (simple) avec système de session pour ne pas avoir à donner son nom à chaque fois
- [ ] ajouter les sons/musique
- [ ] améliorer la bulle de dialogue: plusieurs couleurs et transition. Bleu pour les pseudos, rouge pour les réponses. Bulle blanche puis orange quand la réponse est posée.
- [ ] Marc fait des commentaires sur les joueurs
- [ ] faire trembler les cards quand bonne réponse
- [ ] réordonner les cards à la fin de la manche avec transition jolie
- [ ] horloge grise pendant la pause
- [ ] quand 5 bonnes réponses -> fin de la question
- [ ] animation avec +4/+3... quand bonne réponse
- [ ] bouton "Cliquez pour sortir du salon" à la fin du jeu
- [ ] rajouter l'animation contours blancs de la card d'un joueur qui bougent quand joueur parle
- [ ] assombrir le texte quand une question est terminée
- [ ] mettre un système serveur anti flood
- [ ] permettre aux utilisateurs de corriger une question

Bugs:
- [x] layout shift du header quand on arrive dans une salle
- [x] tableau des scores pas bien ordonné
- [ ] déconnexion quand changement d'onglet

Idée pour générateur de questions:

1. Trouver des thèmes variés et très précis puis génération par chatGPT
2. Faire générer des thèmes variés à chatGPT (be creative !) puis générer des questions sur ces thèmes.
Ensuite embeddings des questions. Puis choisir des questions assez éloignés pour un quizz.
3. 