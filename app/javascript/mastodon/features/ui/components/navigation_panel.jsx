import PropTypes from 'prop-types';
import { Component } from 'react';

import { defineMessages, injectIntl } from 'react-intl';

import { Link } from 'react-router-dom';

import { connect } from 'react-redux';

import { setFilter } from 'mastodon/actions/notifications';
import { WordmarkLogo } from 'mastodon/components/logo';
import NavigationPortal from 'mastodon/components/navigation_portal';
import { transientSingleColumn } from 'mastodon/is_mobile';

import ColumnLink from './column_link';
import DisabledAccountBanner from './disabled_account_banner';
import NotificationsCounterIcon from './notifications_counter_icon';
import SignInBanner from './sign_in_banner';

const messages = defineMessages({
  home: { id: 'legacy.navigation.home', defaultMessage: '홈' },
  publicToots: { id: 'legacy.navigation.public_toots', defaultMessage: '로컬' },
  notifications: { id: 'legacy.navigation.notifications', defaultMessage: '알림' },
  replyMentions: { id: 'legacy.navigation.reply_mentions', defaultMessage: '답장할 멘션' },
  direct: { id: 'legacy.navigation.direct', defaultMessage: 'DM' },
  bookmarks: { id: 'legacy.navigation.bookmarks', defaultMessage: '북마크' },
  lists: { id: 'legacy.navigation.lists', defaultMessage: '리스트' },
  preferences: { id: 'legacy.navigation.preferences', defaultMessage: '환경설정' },
  advancedInterface: { id: 'navigation_bar.advanced_interface', defaultMessage: 'Open in advanced web interface' },
  openedInClassicInterface: { id: 'navigation_bar.opened_in_classic_interface', defaultMessage: 'Posts, accounts, and other specific pages are opened by default in the classic web interface.' },
});

class NavigationPanel extends Component {

  static contextTypes = {
    router: PropTypes.object.isRequired,
    identity: PropTypes.object.isRequired,
  };

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    activeNotificationFilter: PropTypes.string,
  };

  handleNotificationsClick = e => {
    e.preventDefault();
    this.props.dispatch(setFilter('all'));
    this.context.router.history.push('/notifications');
  };

  handleReplyMentionsClick = e => {
    e.preventDefault();
    this.props.dispatch(setFilter('mention'));
    this.context.router.history.push('/notifications');
  };

  render () {
    const { intl } = this.props;
    const { signedIn, disabledAccountId } = this.context.identity;

    return (
      <div className='navigation-panel legacy-navigation-panel'>
        <div className='navigation-panel__logo'>
          <Link to='/home' className='column-link column-link--logo'><WordmarkLogo /></Link>

          {transientSingleColumn ? (
            <div className='switch-to-advanced'>
              {intl.formatMessage(messages.openedInClassicInterface)}
              {' '}
              <a href={`/deck${location.pathname}`} className='switch-to-advanced__toggle'>
                {intl.formatMessage(messages.advancedInterface)}
              </a>
            </div>
          ) : null}
        </div>

        {signedIn && (
          <div className='legacy-navigation-panel__menu'>
            <ColumnLink transparent to='/home' icon='home' text={intl.formatMessage(messages.home)} isActive={(match, location) => location.pathname === '/' || location.pathname === '/home'} />
            <ColumnLink transparent to='/general' icon='globe' text={intl.formatMessage(messages.publicToots)} />
            <ColumnLink
              transparent
              to='/notifications'
              icon={<NotificationsCounterIcon className='column-link__icon' />}
              text={intl.formatMessage(messages.notifications)}
              onClick={this.handleNotificationsClick}
              isActive={(match, location) => location.pathname === '/notifications' && this.props.activeNotificationFilter === 'all'}
            />
            <ColumnLink
              transparent
              to='/notifications'
              icon='comments'
              text={intl.formatMessage(messages.replyMentions)}
              onClick={this.handleReplyMentionsClick}
              isActive={(match, location) => location.pathname === '/notifications' && this.props.activeNotificationFilter === 'mention'}
            />
            <ColumnLink transparent to='/conversations' icon='envelope' text={intl.formatMessage(messages.direct)} />
            <ColumnLink transparent to='/bookmarks' icon='bookmark' text={intl.formatMessage(messages.bookmarks)} />
            <ColumnLink transparent to='/lists' icon='list-ul' text={intl.formatMessage(messages.lists)} />
            <ColumnLink transparent href='/settings/preferences' icon='cog' text={intl.formatMessage(messages.preferences)} />
          </div>
        )}

        {!signedIn && (
          <div className='navigation-panel__sign-in-banner'>
            {disabledAccountId ? <DisabledAccountBanner /> : <SignInBanner />}
          </div>
        )}

        <NavigationPortal />
      </div>
    );
  }

}

const mapStateToProps = state => ({
  activeNotificationFilter: state.getIn(['settings', 'notifications', 'quickFilter', 'active'], 'all'),
});

export default connect(mapStateToProps)(injectIntl(NavigationPanel));
