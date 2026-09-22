import PropTypes from 'prop-types';
import { PureComponent } from 'react';

import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';

import { Helmet } from 'react-helmet';

import { List as ImmutableList } from 'immutable';
import { connect } from 'react-redux';

import { me } from 'mastodon/initial_state';

import { addColumn, removeColumn, moveColumn } from '../../actions/columns';
import { connectPublicStream } from '../../actions/streaming';
import { expandPublicTimeline } from '../../actions/timelines';
import Column from '../../components/column';
import ColumnHeader from '../../components/column_header';
import StatusList from '../../components/status_list';

const messages = defineMessages({
  title: { id: 'column.general', defaultMessage: '일반' },
});

const mapStateToProps = state => {
  const publicItems = state.getIn(['timelines', 'public', 'items'], ImmutableList());
  const publicPending = state.getIn(['timelines', 'public', 'pendingItems'], ImmutableList());
  const statuses = state.get('statuses');

  const isMentionOfMe = status => {
    if (!status) {
      return false;
    }

    const mentions = status.get('mentions', ImmutableList());
    const directlyMentionsMe = mentions.some(mention => mention?.get('id') === me);

    if (directlyMentionsMe) {
      return true;
    }

    const reblogId = status.get('reblog');
    const reblog = reblogId ? statuses.get(reblogId) : null;
    const reblogMentions = reblog?.get('mentions', ImmutableList());

    return !!reblogMentions?.some(mention => mention?.get('id') === me);
  };

  const statusIds = publicPending
    .concat(publicItems)
    .filter(id => id !== null)
    .filter(id => !isMentionOfMe(statuses.get(id)));

  return {
    statusIds,
    isLoading: state.getIn(['timelines', 'public', 'isLoading'], false),
    hasMore: state.getIn(['timelines', 'public', 'hasMore'], true),
    hasUnread: state.getIn(['timelines', 'public', 'unread'], 0) > 0,
  };
};

class GeneralTimeline extends PureComponent {
  static contextTypes = {
    identity: PropTypes.object,
  };

  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    statusIds: PropTypes.object.isRequired,
    isLoading: PropTypes.bool,
    hasMore: PropTypes.bool,
    hasUnread: PropTypes.bool,
    columnId: PropTypes.string,
    multiColumn: PropTypes.bool,
  };

  componentDidMount () {
    const { dispatch } = this.props;
    const { signedIn } = this.context.identity;

    dispatch(expandPublicTimeline());

    if (signedIn) {
      this.disconnect = dispatch(connectPublicStream({ onlyMedia: false, onlyRemote: false }));
    }
  }

  componentWillUnmount () {
    if (this.disconnect) {
      this.disconnect();
      this.disconnect = null;
    }
  }

  handlePin = () => {
    const { columnId, dispatch } = this.props;

    if (columnId) {
      dispatch(removeColumn(columnId));
    } else {
      dispatch(addColumn('GENERAL', {}));
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

  handleLoadMore = () => {
    const maxId = this.props.statusIds.last();

    if (maxId) {
      this.props.dispatch(expandPublicTimeline({ maxId }));
    }
  };

  render () {
    const { intl, statusIds, isLoading, hasMore, hasUnread, columnId, multiColumn } = this.props;
    const pinned = !!columnId;

    return (
      <Column bindToDocument={!multiColumn} ref={this.setRef} label={intl.formatMessage(messages.title)}>
        <ColumnHeader
          icon='comments'
          active={hasUnread}
          title={intl.formatMessage(messages.title)}
          onPin={this.handlePin}
          onMove={this.handleMove}
          onClick={this.handleHeaderClick}
          pinned={pinned}
          multiColumn={multiColumn}
        />

        <StatusList
          statusIds={statusIds}
          isLoading={isLoading}
          hasMore={hasMore}
          trackScroll={!pinned}
          scrollKey={`general_timeline-${columnId}`}
          onLoadMore={this.handleLoadMore}
          timelineId='general'
          emptyMessage={<FormattedMessage id='empty_column.general' defaultMessage='멘션을 제외한 일반 공개 툿이 없습니다.' />}
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

export default connect(mapStateToProps)(injectIntl(GeneralTimeline));
