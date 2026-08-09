GuitarraIA - consolidado Render

Este bootstrap incorpora:
- createSongWithArtist
- requestYouTubePracticeAnalysisV2 / requestYouTubePracticeAnalysis
- completeYouTubePracticeAnalysis callback
- youtubePracticeDiagnosticsV2
- spotifySearch / spotifyArtist / syncSpotifyForSong / syncSpotifyCatalogBatch
- auditPublicSitemap
- generateSeoForSong / generateSeoForCatalogBatch
- amazonProductLookup (ASIN + entrada manual)
- facebookGetPages / facebookPost (requiere FACEBOOK_ACCESS_TOKEN)

Variables Render adicionales para práctica YouTube:
YOUTUBE_PRACTICE_WORKER_URL
YOUTUBE_PRACTICE_REQUEST_SECRET
YOUTUBE_PRACTICE_UPLOAD_SECRET
YOUTUBE_PRACTICE_CALLBACK_SECRET

El worker Cloud Run debe usar como callback:
https://guitarraia-render.onrender.com/api/functions/completeYouTubePracticeAnalysis
