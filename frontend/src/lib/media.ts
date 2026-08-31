export function resolveAvatarUrl(avatarUrl?: any): string | undefined {
  if (!avatarUrl || typeof avatarUrl !== 'string') return undefined;
  if (avatarUrl.startsWith('data:')) return avatarUrl;

  const currentHost = window.location.hostname;
  const currentProtocol = window.location.protocol;

  if (avatarUrl.startsWith('/storage/') || avatarUrl.startsWith('storage/')) {
    const cleanPath = avatarUrl.startsWith('/') ? avatarUrl : `/${avatarUrl}`;
    if (currentHost === 'localhost' || currentHost === '127.0.0.1' || currentHost.startsWith('192.168.') || currentHost.startsWith('10.')) {
      return `${currentProtocol}//${currentHost}/snad/backend/public${cleanPath}`;
    }
    return cleanPath;
  }

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
    if (currentHost === 'localhost' || currentHost === '127.0.0.1' || currentHost.startsWith('192.168.') || currentHost.startsWith('10.')) {
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/snad')) {
        return `${currentProtocol}//${currentHost}/snad${cleanPath}`;
      }
      return `${currentProtocol}//${currentHost}${currentPort}${cleanPath}`;
    }
    return cleanPath;
  }

  if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('uploads/') || imageUrl.startsWith('/storage/') || imageUrl.startsWith('storage/')) {
    const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    if (currentHost === 'localhost' || currentHost === '127.0.0.1' || currentHost.startsWith('192.168.') || currentHost.startsWith('10.')) {
      return `${currentProtocol}//${currentHost}/snad/backend/public${cleanPath}`;
    }
    return cleanPath;
  }

  if (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')) {
    return imageUrl.replace(/localhost|127\.0\.0\.1/g, currentHost);
  }

  return imageUrl;
}
