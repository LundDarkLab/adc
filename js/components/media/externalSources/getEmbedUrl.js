export function getEmbedUrl(url) {
  if (!url) return null;

  // YouTube: watch?v=ID, youtu.be/ID, embed/ID
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?origin=${encodeURIComponent(window.location.origin)}`;

  // Vimeo: vimeo.com/ID o player.vimeo.com/video/ID
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return null;
}
