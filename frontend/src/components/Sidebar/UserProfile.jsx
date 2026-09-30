function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function UserProfile({ name, avatarUrl }) {
  return (
    <div className="user-profile">
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="user-profile__avatar" />
      ) : (
        <div className="user-profile__avatar user-profile__avatar--fallback">
          {getInitials(name)}
        </div>
      )}
      <span className="user-profile__name">{name}</span>
    </div>
  );
}

export default UserProfile;