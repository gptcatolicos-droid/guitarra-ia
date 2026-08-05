import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export const DEFAULT_NAV_VISIBILITY = {
  home: true,
  tuner: true,
  practice: true,
  unplugged: true,
  chords: true,
  blog: true,
  infographics: true,
  store: true,
  chat: true,
};

export function useNavigationVisibility() {
  const [visibility, setVisibility] = useState(DEFAULT_NAV_VISIBILITY);

  useEffect(() => {
    let active = true;
    base44.entities.NavigationSettings.list('-updated_date', 1)
      .then((rows) => {
        if (active && rows?.[0]) setVisibility({ ...DEFAULT_NAV_VISIBILITY, ...(rows[0].visibility || {}) });
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  return visibility;
}
