export const HUB_UPDATED_EVENT = 'hub-updated';

export function notifyHubUpdated() {
  window.dispatchEvent(new Event(HUB_UPDATED_EVENT));
}
