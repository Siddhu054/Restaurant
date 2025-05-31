/* eslint-disable no-restricted-globals */
import { precacheAndRoute } from "workbox-precaching";

// This must be present for Workbox InjectManifest to work
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
