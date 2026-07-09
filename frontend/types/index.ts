export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  role_name: string;
  can_edit: boolean;
};

export type Resource = {
  id: string;
  name: string;
  url: string;
  category: string;
  tags: string[];
  resource_type: string;
  icon_url: string | null;
  created_at: string;
  is_favorite?: boolean;
};

export type ResourceInput = {
  name: string;
  url: string;
  category: string;
  tags: string[];
};

export type HubData = {
  profile: Profile;
  resources: Resource[];
  can_edit: boolean;
};

export type ClickRow = {
  id: string;
  clicked_at: string;
  resource_id: string;
  user_id: string;
  resources: {
    id: string;
    name: string;
    category: string;
    resource_type: string;
  } | null;
  profiles: {
    username: string;
  } | null;
};

export type FavoriteRow = {
  user_id: string;
  resource_id: string;
  resources: {
    id: string;
    name: string;
    category: string;
    resource_type: string;
  } | null;
};

export type AnalyticsData = {
  clicks: ClickRow[];
  favorites: FavoriteRow[];
};

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

export type ToggleFavoriteResult =
  | { success: true; isFavorite: boolean }
  | { success: false; error: string };
