import headerLightLogo from 'mastodon/../images/logos/Header-Logo-Light.png';
const headerDarkLogo = '/header-logo-dark-2026.webp';
import symbolLogo from 'mastodon/../images/logos/logo_dark.png';

export const WordmarkLogo: React.FC = () => (
  <>
    <img
      src={headerLightLogo}
      alt='Legacy'
      className='logo legacy-logo legacy-logo--light'
    />
    <img
      src={headerDarkLogo}
      alt='Legacy'
      className='logo legacy-logo legacy-logo--dark'
    />
  </>
);

export const SymbolLogo: React.FC = () => (
  <img src={symbolLogo} alt='Legacy' className='logo logo--icon' />
);
