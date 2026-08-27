# Rakhi Surprise — Shimpi

Mobile-first one-time Rakhi surprise.

## Replace photos
Put your images in `assets/` and edit the `photos` array in `config.js`. The app automatically supports any number of photos. Portrait and landscape photos are detected automatically.

Use `type: "special"` for the photo of Shimpi tying Rakhi last year. It gets a slower, softer animation and remains longer.

Example:
`{file:"rakhi-special.jpg",type:"special",caption:"पिछली राखी... जब तुमने मेरे हाथ पर राखी बाँधी थी। ❤️"}`

## Replace audio
Put your legally obtained audio file at:
`assets/phoolon-ka-taaron-ka.mp3`

The music begins after the first tap, which is suitable for mobile browser autoplay restrictions.

## Test
Run a local static server, for example:
`python -m http.server 8000`
Then open `http://localhost:8000`.

## GitHub Pages
Upload the project to a repository and enable Pages from the main branch/root. The project is static and requires no build step.

## Backend
For now `apiEndpoint` is blank, so the app works without a backend and logs events to the browser console. In the next step we can add a small Cloudflare Worker endpoint that writes completion events to a Google Sheet and notifies you.

Important event: `gift_unlocked` with `amount: 2001`.
