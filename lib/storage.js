export function getViews(id) {
  return parseInt(localStorage.getItem(`views_${id}`) || '0', 10) || 0;
}

export function addView(id) {
  const count = getViews(id) + 1;
  localStorage.setItem(`views_${id}`, count);
  return count;
}

export function getLikes(id) {
  return parseInt(localStorage.getItem(`likes_${id}`) || '0', 10) || 0;
}

export function isLiked(id) {
  return localStorage.getItem(`liked_${id}`) === '1';
}

export function toggleLike(id) {
  const liked = isLiked(id);
  let count = getLikes(id);
  if (liked) {
    count = Math.max(0, count - 1);
    localStorage.removeItem(`liked_${id}`);
  } else {
    count += 1;
    localStorage.setItem(`liked_${id}`, '1');
  }
  localStorage.setItem(`likes_${id}`, count);
  return { count, liked: !liked };
}
