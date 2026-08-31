export function resolveAvatarUrl(avatarUrl?: any): string | undefined {
  if (!avatarUrl || typeof avatarUrl !== 'string') return undefined;
  if (avatarUrl.startsWith('data:')) return avatarUrl;

  const currentHost = window.location.hostname;
  const currentProtocol = window.location.protocol;

  // If it's a relative path like /storage/avatars/xxx or storage/avatars/xxx
  if (avatarUrl.startsWith('/storage/') || avatarUrl.startsWith('storage/')) {
    const cleanPath = avatarUrl.startsWith('/') ? avatarUrl : `/${avatarUrl}`;
    return `${currentProtocol}//${currentHost}/snad/backend/public${cleanPath}`;
  }

  // If it's a full URL containing localhost or 127.0.0.1, replace host with current browsing host
  if (avatarUrl.includes('localhost') || avatarUrl.includes('127.0.0.1')) {
    return avatarUrl.replace(/localhost|127\.0\.0\.1/g, currentHost);
  }

  return avatarUrl;
}

export function resolveMealImageUrl(imageUrl?: any): string | undefined {
  if (!imageUrl || typeof imageUrl !== 'string') return undefined;
  if (imageUrl.startsWith('data:')) return imageUrl;

  const currentHost = window.location.hostname;
  const currentProtocol = window.location.protocol;
  const currentPort = window.location.port ? `:${window.location.port}` : '';

  if (imageUrl.startsWith('/images/') || imageUrl.startsWith('images/')) {
    const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    return `${currentProtocol}//${currentHost}${currentPort}${cleanPath}`;
  }

  if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('uploads/')) {
    const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    return `${currentProtocol}//${currentHost}/snad/backend/public${cleanPath}`;
  }

  if (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')) {
    return imageUrl.replace(/localhost|127\.0\.0\.1/g, currentHost);
  }

  return imageUrl;
}
