import headerLightLogo from 'mastodon/../images/logos/Header-Logo-Light.png';
import symbolLogo from 'mastodon/../images/logos/logo_dark.png';

export const WordmarkLogo: React.FC = () => (
  <>
    <img
      src={headerLightLogo}
      alt='Legacy'
      className='logo legacy-logo legacy-logo--light'
    />
  </>
);

export const SymbolLogo: React.FC = () => (
  <img src={symbolLogo} alt='Legacy' className='logo logo--icon' />
);
