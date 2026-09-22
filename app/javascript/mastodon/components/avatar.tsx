import classNames from 'classnames';

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

const DEFAULT_AVATAR = '/avatars/original/legacy-raven-v3.png';

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

  const style = {
    ...styleFromParent,
    width: `${size}px`,
    height: `${size}px`,
  };

  const accountAvatar =
    hovering || animate
      ? account?.get('avatar')
      : account?.get('avatar_static');

  const src =
    !accountAvatar || DEFAULT_AVATAR_PATTERN.test(accountAvatar)
      ? DEFAULT_AVATAR
      : accountAvatar;

  const handleImageError: React.ReactEventHandler<HTMLImageElement> = (event) => {
    if (!event.currentTarget.src.endsWith(DEFAULT_AVATAR)) {
      event.currentTarget.src = DEFAULT_AVATAR;
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
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </div>
  );
};
