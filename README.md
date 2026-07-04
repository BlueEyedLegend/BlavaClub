Place the GIF and audio files here so Vite copies them to the build output.

Required files:
- letitride.gif
- let-it-ride-made-with-Voicemod.mp3

Move example (PowerShell):

    Move-Item .\letitride.gif .\public\letitride.gif
    Move-Item .\let-it-ride-made-with-Voicemod.mp3 .\public\let-it-ride-made-with-Voicemod.mp3

Then rebuild and deploy:

```bash
npm run build
npm run deploy
```

After deployment, check the site at `https://BlueEyedLegend.github.io/BlavaClub/` and inspect network requests if assets still 404.