// Light / dark theme. "system" follows the OS setting (the default); the choice
// is kept per browser in localStorage. THEME_SCRIPT runs in <head> before first
// paint so a dark-mode user never sees a white flash.

export type ThemePref = 'system' | 'light' | 'dark';
export const THEME_KEY = 'ft-theme';
export const THEME_EVENT = 'ft-theme-change';

export const THEME_SCRIPT = `(function(){
  var k='${THEME_KEY}', m=window.matchMedia('(prefers-color-scheme: dark)');
  function pref(){ try { return localStorage.getItem(k) || 'system'; } catch(e) { return 'system'; } }
  function apply(){ var p=pref(), d=p==='dark'||(p==='system'&&m.matches);
    document.documentElement.classList.toggle('dark', d);
    document.documentElement.dataset.themePref=p;
    window.dispatchEvent(new Event('${THEME_EVENT}')); }
  apply();
  m.addEventListener('change', apply);
  window.addEventListener('storage', function(e){ if(e.key===k) apply(); });
  window.__ftApplyTheme=apply;
  // Reports print on white whatever the screen theme.
  var was=false;
  window.addEventListener('beforeprint', function(){ was=document.documentElement.classList.contains('dark'); document.documentElement.classList.remove('dark'); window.dispatchEvent(new Event('${THEME_EVENT}')); });
  window.addEventListener('afterprint', function(){ if(was) document.documentElement.classList.add('dark'); window.dispatchEvent(new Event('${THEME_EVENT}')); });
})();`;

export function getThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

export function setThemePref(p: ThemePref) {
  try {
    if (p === 'system') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, p);
  } catch {
    // storage blocked: the choice just won't persist
  }
  (window as unknown as { __ftApplyTheme?: () => void }).__ftApplyTheme?.();
}

export const isDarkNow = () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
