export const mainLinks = [
  { label: 'home', href: 'index.php', title:"Home page", icon: 'mdi-home' },
  { label: 'map', href: 'map.php', title:"Interactive map", icon: 'mdi-map' },
  { label: 'credits', href:'https://www.darklab.lu.se/digital-collections/dynamic-collections/credits/', title:'link to the Darklab Credit page [external link]', icon:'mdi-account-group'},
  { label: 'legal', href: 'policy.php', title:"Privacy policy", icon: 'mdi-shield-check' },
  { label: 'db model', href: 'db_model.php', title:"Database architecture", icon: 'mdi-database' },
  { label: 'login', href: 'login.php', title:"Login to your account", icon: 'mdi-login-variant' }
];

export const toggleMenuBtn = [{ id: 'toggleMenu', href: '#', icon: 'mdi-menu' }];
export const dashBoardBtn = [{label: 'dashboard', href: 'dashboard.php', title:"User dashboard", icon: 'mdi-view-dashboard' }]

export const mainSectionMenu = [
  {label: 'artifact', href: 'artifacts_add.php', title:"Add a new artifact", icon:'mdi-axe'},
  {label: 'model', href: 'model_add.php', title:"Add a new model", icon:'mdi-cube-outline'},
  {label: 'institution', href: 'institution_add.php', title:"Add a new institution", icon:'mdi-bank'},
  {label: 'person', href: 'person_add.php', title:"Add a new person", icon:'mdi-book-account'},
];

export const adminSectionMenu = [
  {label: 'timeline', href: 'timeline.php', title:"Manage timeline events", icon:'mdi-timeline-clock-outline'},
  {label:'vocabularies', href:'vocabularies.php', title:"Manage controlled vocabularies", icon:'mdi-format-list-bulleted-square'},
  {label:'compose email', href:'mailComposer.php', title:"Compose and send email", icon:'mdi-email-fast'},
];

export const userAccountMenu = [
  {label: 'settings', href: 'settings.php', title:"User settings", icon:'mdi-cog'},
  {label: 'my collections', href: '#', title:"View and manage your collections", icon:'mdi-image-multiple'},
  {label: 'logout', href: 'logout.php', title:"Logout from your account", icon:'mdi-logout-variant'},
];