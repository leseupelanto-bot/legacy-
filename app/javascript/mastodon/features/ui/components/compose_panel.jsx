import PropTypes from 'prop-types';
import { PureComponent } from 'react';

import { connect } from 'react-redux';

import { changeComposing, mountCompose, unmountCompose } from 'mastodon/actions/compose';
import ServerBanner from 'mastodon/components/server_banner';
import ComposeFormContainer from 'mastodon/features/compose/containers/compose_form_container';
import NavigationContainer from 'mastodon/features/compose/containers/navigation_container';
import SearchContainer from 'mastodon/features/compose/containers/search_container';

import LinkFooter from './link_footer';

class ComposePanel extends PureComponent {

  static contextTypes = {
    identity: PropTypes.object.isRequired,
  };

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
  };

  onFocus = () => {
    const { dispatch } = this.props;
    dispatch(changeComposing(true));
  };

  onBlur = () => {
    const { dispatch } = this.props;
    dispatch(changeComposing(false));
  };

  componentDidMount () {
    const { dispatch } = this.props;
    dispatch(mountCompose());
  }

  componentWillUnmount () {
    const { dispatch } = this.props;
    dispatch(unmountCompose());
  }

  render() {
    const { signedIn } = this.context.identity;

    return (
      <div className='compose-panel legacy-compose-panel' onFocus={this.onFocus}>
        <div className='legacy-compose-panel__search'>
          <SearchContainer openInRoute />
        </div>

        {!signedIn && (
          <>
            <ServerBanner />
            <div className='flex-spacer' />
          </>
        )}

        {signedIn && (
          <>
            <div className='legacy-compose-panel__profile'>
              <NavigationContainer onClose={this.onBlur} />
            </div>
            <div className='legacy-compose-panel__editor'>
              <ComposeFormContainer singleColumn />
            </div>
          </>
        )}

        <div className='legacy-compose-panel__footer'>
          <LinkFooter />
        </div>
      </div>
    );
  }

}

export default connect()(ComposePanel);
