import headerLightLogo from 'mastodon/../images/logos/Header-Logo-Light.png';
import headerDarkLogo from 'mastodon/../images/logos/Header-Logo-Dark.png';
import symbolLogo from 'mastodon/../images/logos/logo_dark.png';

export const WordmarkLogo: React.FC = () => (
  <>
    <img
      src={headerLightLogo}
      alt='Legacy'
      className='logo logo--wordmark legacy-logo legacy-logo--light'
    />
    <img
      src={headerDarkLogo}
      alt='Legacy'
      className='logo logo--wordmark legacy-logo legacy-logo--dark'
    />
  </>
);

export const SymbolLogo: React.FC = () => (
  <img src={symbolLogo} alt='Legacy' className='logo logo--icon' />
);
