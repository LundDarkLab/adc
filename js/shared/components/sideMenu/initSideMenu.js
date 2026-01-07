import { buildSideMenu } from "./helpers/buildSideMenuHelper.js";
export async function initSideMenu() {
  const navEl = document.getElementById('sideMenu');
  try {
    const nav = await fetch('assets/navigation/sideMenu.html')
    const navHtml = await nav.text();
    navEl.innerHTML = navHtml;
    await buildSideMenu();
  } catch (error) {
    console.error('Errore caricamento sideMenu:', error);    
  }
}