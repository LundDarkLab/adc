
export function isIOS() {
  // Controllo moderno: usa navigator.userAgentData se disponibile
  if (navigator.userAgentData && navigator.userAgentData.platform) {
    return navigator.userAgentData.platform === 'iOS';
  }
  // Fallback: regex semplificata su userAgent (per browser vecchi, evita navigator.platform deprecata)
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !/MSStream/.test(navigator.userAgent);
}

export function isMobile() {
  // Controllo moderno: usa navigator.userAgentData.mobile se disponibile
  if (navigator.userAgentData && typeof navigator.userAgentData.mobile === 'boolean') {
    return navigator.userAgentData.mobile;
  }
  // Fallback: regex semplificata su userAgent (per browser vecchi, senza navigator.vendor deprecato)
  return /Mobi|Android/i.test(navigator.userAgent) || /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function checkDevice(){
  let device;
  if(
    screen.width >= 1024 &&
    screen.orientation.type.split('-')[0] == 'landscape' &&
    (screen.orientation.angle == 90 || screen.orientation.angle == 270)
  ){device = 'tablet-landscape'}
  
  if(//tablet and hybrid laptop (ex. surface pro), portrait
    (screen.width >= 768 && screen.width < 1024) &&
    screen.orientation.type.split('-')[0] == 'portrait' &&
    (screen.orientation.angle == 0 || screen.orientation.angle == 180)
  ){device = 'tablet-portrait'}

  if(//laptop and desktop
    screen.width >= 1024 &&
    screen.orientation.type.split('-')[0] == 'landscape' &&
    (screen.orientation.angle == 0 || screen.orientation.angle == 180)
  ){device='pc'}
  return device;
}