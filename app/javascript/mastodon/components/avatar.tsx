import classNames from 'classnames';

import ravenAvatar from 'mastodon/../images/avatars/legacy-raven.png';
import { useHovering } from '../../hooks/useHovering';
import type { Account } from '../../types/resources';
import { autoPlayGif } from '../initial_state';

interface Props {
  account: Account | undefined; // FIXME: remove `undefined` once we know for sure its always there
  size: number;
  style?: React.CSSProperties;
  inline?: boolean;
  animate?: boolean;
}

const DEFAULT_AVATAR_PATTERN =
  /\/avatars\/original\/(?:missing|legacy-raven(?:-v3)?)\.png(?:\?|$)/i;

export const Avatar: React.FC<Props> = ({
  account,
  animate = autoPlayGif,
  size = 20,
  inline = false,
  style: styleFromParent,
}) => {
  const { hovering, handleMouseEnter, handleMouseLeave } = useHovering(animate);

  const accountAvatar =
    hovering || animate
      ? account?.get('avatar')
      : account?.get('avatar_static');

  const avatarMissing = account?.get('avatar_missing') === true;

  const src =
    account &&
    !avatarMissing &&
    accountAvatar &&
    !DEFAULT_AVATAR_PATTERN.test(accountAvatar)
      ? accountAvatar
      : ravenAvatar;

  const style = {
    ...styleFromParent,
    width: `${size}px`,
    height: `${size}px`,
    backgroundImage: `url("${ravenAvatar}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };

  const handleImageError: React.ReactEventHandler<HTMLImageElement> = (event) => {
    if (event.currentTarget.src !== ravenAvatar) {
      event.currentTarget.src = ravenAvatar;
    }
  };

  return (
    <div
      className={classNames('account__avatar', {
        'account__avatar-inline': inline,
      })}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={style}
    >
      <img
        src={src}
        alt={account?.get('acct') ?? ''}
        onError={handleImageError}
      />
    </div>
  );
};
