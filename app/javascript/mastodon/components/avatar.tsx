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

const DEFAULT_AVATAR = 'data:image/jpeg;base64,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';

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

  const avatarMissing = account?.get('avatar_missing') === true;

  const accountAvatar =
    hovering || animate
      ? account?.get('avatar')
      : account?.get('avatar_static');

  const src =
    avatarMissing || !accountAvatar || DEFAULT_AVATAR_PATTERN.test(accountAvatar)
      ? DEFAULT_AVATAR
      : accountAvatar;

  const handleImageError: React.ReactEventHandler<HTMLImageElement> = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = DEFAULT_AVATAR;
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
