
import { buildMenu } from "./helpers/buildHeaderMenuHelper.js";

export async function initHeaderMenu() {
  try {
    const headerEl = document.getElementById('header');
    const header = await fetch('assets/navigation/header.html')
    const headerHtml = await header.text();
    headerEl.innerHTML = headerHtml;

    await buildMenu();
  } catch (error) {
    console.error('Errore caricamento header:', error);    
  }
}