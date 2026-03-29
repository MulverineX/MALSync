declare const self: {
  registration: {
    showNotification(title: string, options?: NotificationOptions): Promise<void>;
  };
};

export const defaultImg =
  'https://raw.githubusercontent.com/MALSync/MALSync/master/assets/icons/icon128.png';

// Only works on the background Page (service worker)
export async function sendNotification(options: {
  url: string;
  title: string;
  text: string;
  image?: string;
  sticky?: boolean;
}) {
  if (!options.image) options.image = defaultImg;

  con.m('Notification').log(options);

  const imgBlob = await getImageBlob(options.image);

  const notificationOptions: NotificationOptions = {
    body: options.text,
    icon: imgBlob,
    tag: options.url,
    data: { url: options.url },
    requireInteraction: options.sticky ?? false,
  };

  try {
    await self.registration.showNotification(options.title, notificationOptions);
  } catch (e) {
    con.error(e);
    // Fallback without requireInteraction
    delete notificationOptions.requireInteraction;
    try {
      await self.registration.showNotification(options.title, notificationOptions);
    } catch (e2) {
      con.error(e2);
    }
  }
}

function getImageBlob(url, fallback = false): Promise<string> {
  if (fallback) url = defaultImg;
  return fetch(url)
    .then(r => {
      if (!r.ok) throw new Error('Could not get image');
      return r.blob();
    })
    .then(blob => blobToBase64(blob))
    .catch(e => {
      if (!fallback) {
        con.info('Could not get image for notification', url);
        return getImageBlob(url, true);
      }
      throw e;
    });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}
