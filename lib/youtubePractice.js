const normalize = (value = '') => value
  .toString()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

/**
 * Practice-video mappings are intentionally kept separate from the Song entity.
 * This lets us validate the YouTube practice experience with one catalog item
 * before adding a managed timeline field to the admin or database.
 */
const PRACTICE_VIDEOS = [
  {
    matches: (song) => {
      const title = normalize(song?.title);
      const artist = normalize(song?.artist_name);
      return title.includes('silent lucidity') && artist.includes('queensryche');
    },
    videoId: 'jhat-xUQ6dw',
    title: 'Silent Lucidity — Queensrÿche',
    sections: [
      { time: 0, label: 'Intro' },
      { time: 31, label: 'Verso' },
      { time: 73, label: 'Coro' },
      { time: 123, label: 'Verso' },
      { time: 181, label: 'Puente' },
      { time: 228, label: 'Coro final' },
    ],
  },
];

export function getYouTubePracticeForSong(song) {
  return PRACTICE_VIDEOS.find((video) => video.matches(song)) || null;
}
