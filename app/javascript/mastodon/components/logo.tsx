import legacyLightLogo from 'mastodon/../images/logos/Logo-Light.png';
import legacyDarkLogo from 'mastodon/../images/logos/Logo-Dark.png';
import symbolLogo from 'mastodon/../images/logos/logo_dark.png';

export const WordmarkLogo: React.FC = () => (
  <>
    <img
      src={legacyLightLogo}
      alt='Legacy'
      className='logo logo--wordmark legacy-logo legacy-logo--light'
    />
    <img
      src={legacyDarkLogo}
      alt='Legacy'
      className='logo logo--wordmark legacy-logo legacy-logo--dark'
    />
  </>
);

export const SymbolLogo: React.FC = () => (
  <img src={symbolLogo} alt='Legacy' className='logo logo--icon' />
);
