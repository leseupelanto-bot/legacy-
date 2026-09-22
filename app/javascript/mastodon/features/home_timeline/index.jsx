import PropTypes from 'prop-types';
import { PureComponent } from 'react';

import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';

import classNames from 'classnames';
import { Helmet } from 'react-helmet';

import { List as ImmutableList } from 'immutable';
import { connect } from 'react-redux';

import api from 'mastodon/api';
import { fetchAnnouncements, toggleShowAnnouncements } from 'mastodon/actions/announcements';
import { importFetchedStatuses } from 'mastodon/actions/importer';
import { IconWithBadge } from 'mastodon/components/icon_with_badge';
import { criticalUpdatesPending } from 'mastodon/initial_state';

import { addColumn, removeColumn, moveColumn } from '../../actions/columns';
import { connectPublicStream } from '../../actions/streaming';
import { expandPublicTimeline } from '../../actions/timelines';
import Column from '../../components/column';
import ColumnHeader from '../../components/column_header';
import StatusList from '../../components/status_list';

import AnnouncementsContainer from 'mastodon/features/getting_started/containers/announcements_container';

import { CriticalUpdateBanner } from './components/critical_update_banner';

const messages = defineMessages({
  title: { id: 'column.home', defaultMessage: 'Home' },
  show_announcements: { id: 'home.show_announcements', defaultMessage: 'Show announcements' },
  hide_announcements: { id: 'home.hide_announcements', defaultMessage: 'Hide announcements' },
});

const mapStateToProps = state => {
  const publicItems = state.getIn(['timelines', 'public', 'items'], ImmutableList());
  const publicPending = state.getIn(['timelines', 'public', 'pendingItems'], ImmutableList());
  const statuses = state.get('statuses');

  const isDirectStatus = status => {
    if (!status) {
      return false;
    }

    if (status.get('visibility') === 'direct') {
      return true;
    }

    const reblogId = status.get('reblog');
    const reblog = reblogId ? statuses.get(reblogId) : null;

    return reblog?.get('visibility') === 'direct';
  };

  return {
    publicStatusIds: publicPending
      .concat(publicItems)
      .filter(id => id !== null)
      .filter(id => !isDirectStatus(statuses.get(id))),
    statuses,
    isLoadingPublic: state.getIn(['timelines', 'public', 'isLoading'], false),
    hasMorePublic: state.getIn(['timelines', 'public', 'hasMore'], true),
    hasUnread: state.getIn(['timelines', 'public', 'unread'], 0) > 0,
    hasAnnouncements: !state.getIn(['announcements', 'items']).isEmpty(),
    unreadAnnouncements: state.getIn(['announcements', 'items']).count(item => !item.get('read')),
    showAnnouncements: state.getIn(['announcements', 'show']),
  };
};

class HomeTimeline extends PureComponent {
  static contextTypes = {
    identity: PropTypes.object,
  };

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    publicStatusIds: PropTypes.object.isRequired,
    statuses: PropTypes.object.isRequired,
    isLoadingPublic: PropTypes.bool,
    hasMorePublic: PropTypes.bool,
    hasUnread: PropTypes.bool,
    columnId: PropTypes.string,
    multiColumn: PropTypes.bool,
    hasAnnouncements: PropTypes.bool,
    unreadAnnouncements: PropTypes.number,
    showAnnouncements: PropTypes.bool,
  };

  state = {
    mentions: [],
    mentionSinceId: null,
    mentionMaxId: null,
    mentionHasMore: true,
    mentionLoading: false,
  };

  handlePin = () => {
    const { columnId, dispatch } = this.props;

    if (columnId) {
      dispatch(removeColumn(columnId));
    } else {
      dispatch(addColumn('HOME', {}));
    }
  };

  handleMove = dir => {
    this.props.dispatch(moveColumn(this.props.columnId, dir));
  };

  handleHeaderClick = () => {
    this.column?.scrollTop();
  };

  setRef = c => {
    this.column = c;
  };

  componentDidMount () {
    const { dispatch } = this.props;
    const { signedIn } = this.context.identity;

    setTimeout(() => dispatch(fetchAnnouncements()), 700);
    dispatch(expandPublicTimeline());

    if (signedIn) {
      this.disconnectPublic = dispatch(connectPublicStream({ onlyMedia: false, onlyRemote: false }));
      this.fetchMentions('initial');
      this.mentionPoll = setInterval(() => this.fetchMentions('newer'), 15000);
    }
  }

  componentWillUnmount () {
    if (this.disconnectPublic) {
      this.disconnectPublic();
      this.disconnectPublic = null;
    }

    if (this.mentionPoll) {
      clearInterval(this.mentionPoll);
      this.mentionPoll = null;
    }
  }

  fetchMentions = mode => {
    const { signedIn } = this.context.identity;

    if (!signedIn || this.mentionLoading) {
      return;
    }

    const { mentionSinceId, mentionMaxId } = this.state;

    if (mode === 'older' && !mentionMaxId) {
      return;
    }

    const params = {
      types: ['mention'],
      limit: 40,
    };

    if (mode === 'newer' && mentionSinceId) {
      params.since_id = mentionSinceId;
    } else if (mode === 'older' && mentionMaxId) {
      params.max_id = mentionMaxId;
    }

    this.mentionLoading = true;
    this.setState({ mentionLoading: true });

    this.props.dispatch((dispatch, getState) => {
      api(getState).get('/api/v1/notifications', { params }).then(response => {
        const notifications = response.data || [];
        const mentionNotifications = notifications.filter(item =>
          item.type === 'mention'
          && item.status
          && item.status.visibility !== 'direct'
        );
        const statuses = mentionNotifications.map(item => item.status);

        if (statuses.length > 0) {
          dispatch(importFetchedStatuses(statuses));
        }

        const incoming = mentionNotifications
          .map(item => ({
            notificationId: item.id,
            statusId: item.status.id,
            createdAt: item.status.created_at,
          }));

        this.setState(prevState => {
          const byStatus = new Map();

          prevState.mentions.forEach(item => byStatus.set(item.statusId, item));
          incoming.forEach(item => byStatus.set(item.statusId, item));

          const mentions = Array.from(byStatus.values()).sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          const firstId = notifications[0]?.id || null;
          const lastId = notifications[notifications.length - 1]?.id || null;

          return {
            mentions,
            mentionSinceId: mode === 'older'
              ? prevState.mentionSinceId
              : (firstId || prevState.mentionSinceId),
            mentionMaxId: mode === 'newer'
              ? prevState.mentionMaxId
              : (lastId || prevState.mentionMaxId),
            mentionHasMore: mode === 'newer'
              ? prevState.mentionHasMore
              : notifications.length >= 40,
            mentionLoading: false,
          };
        });
      }).catch(() => {
        this.setState({ mentionLoading: false });
      }).finally(() => {
        this.mentionLoading = false;
      });
    });
  };

  handleLoadMore = () => {
    const publicMaxId = this.props.publicStatusIds.last();

    if (publicMaxId && this.props.hasMorePublic) {
      this.props.dispatch(expandPublicTimeline({ maxId: publicMaxId }));
    }

    if (this.state.mentionHasMore) {
      this.fetchMentions('older');
    }
  };

  handleToggleAnnouncementsClick = e => {
    e.stopPropagation();
    this.props.dispatch(toggleShowAnnouncements());
  };

  getCombinedStatusIds = () => {
    const { publicStatusIds, statuses } = this.props;
    const entries = new Map();

    publicStatusIds.forEach(id => {
      const status = statuses.get(id);
      const createdAt = status?.get('created_at');

      if (createdAt && status?.get('visibility') !== 'direct') {
        entries.set(id, {
          id,
          createdAt,
          priority: 0,
        });
      }
    });

    this.state.mentions.forEach(item => {
      const status = statuses.get(item.statusId);
      const createdAt = status?.get('created_at') || item.createdAt;

      if (createdAt && status?.get('visibility') !== 'direct') {
        entries.set(item.statusId, {
          id: item.statusId,
          createdAt,
          priority: 1,
        });
      }
    });

    return ImmutableList(
      Array.from(entries.values())
        .sort((a, b) => {
          const delta = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

          if (delta !== 0) {
            return delta;
          }

          return b.priority - a.priority;
        })
        .map(item => item.id)
    );
  };

  render () {
    const {
      intl,
      hasUnread,
      columnId,
      multiColumn,
      isLoadingPublic,
      hasMorePublic,
      hasAnnouncements,
      unreadAnnouncements,
      showAnnouncements,
    } = this.props;

    const pinned = !!columnId;
    const statusIds = this.getCombinedStatusIds();
    const banners = [];

    if (criticalUpdatesPending) {
      banners.push(<CriticalUpdateBanner key='critical-update-banner' />);
    }

    let announcementsButton;

    if (hasAnnouncements) {
      announcementsButton = (
        <button
          type='button'
          className={classNames('column-header__button', { active: showAnnouncements })}
          title={intl.formatMessage(showAnnouncements ? messages.hide_announcements : messages.show_announcements)}
          aria-label={intl.formatMessage(showAnnouncements ? messages.hide_announcements : messages.show_announcements)}
          onClick={this.handleToggleAnnouncementsClick}
        >
          <IconWithBadge id='bullhorn' count={unreadAnnouncements} />
        </button>
      );
    }

    return (
      <Column bindToDocument={!multiColumn} ref={this.setRef} label={intl.formatMessage(messages.title)}>
        <ColumnHeader
          icon='home'
          active={hasUnread}
          title={intl.formatMessage(messages.title)}
          onPin={this.handlePin}
          onMove={this.handleMove}
          onClick={this.handleHeaderClick}
          pinned={pinned}
          multiColumn={multiColumn}
          extraButton={announcementsButton}
          appendContent={hasAnnouncements && showAnnouncements && <AnnouncementsContainer />}
        />

        <StatusList
          prepend={banners}
          alwaysPrepend
          statusIds={statusIds}
          isLoading={isLoadingPublic || (this.state.mentionLoading && statusIds.isEmpty())}
          hasMore={hasMorePublic || this.state.mentionHasMore}
          trackScroll={!pinned}
          scrollKey={`legacy_home_timeline-${columnId}`}
          onLoadMore={this.handleLoadMore}
          timelineId='legacy-home'
          emptyMessage={<FormattedMessage id='empty_column.public' defaultMessage='There are no public posts or mentions yet.' />}
          bindToDocument={!multiColumn}
        />

        <Helmet>
          <title>{intl.formatMessage(messages.title)}</title>
          <meta name='robots' content='noindex' />
        </Helmet>
      </Column>
    );
  }
}

export default connect(mapStateToProps)(injectIntl(HomeTimeline));
