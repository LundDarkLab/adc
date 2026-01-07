const getBasePath = () => {
  const path = window.location.pathname;
  if (path.includes('/prototype_dev/')) { return '/prototype_dev/'; }
  if (path.includes('/plus/')) { return '/plus/'; }
  return '/';
};

const BASE_PATH = getBasePath();
const API = BASE_PATH + 'api/';
export const ENDPOINT = window.location.origin +  API + 'endpoint_private.php';