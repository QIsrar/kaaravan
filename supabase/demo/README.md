# Demo Data

Demo data for development only.

- **Load:**
  ```bash
  pnpm dlx supabase db query --linked -f supabase/demo/demo_data.sql
  ```

- **Remove before launch:**
  ```bash
  pnpm dlx supabase db query --linked -f supabase/demo/demo_data_remove.sql
  ```

### Expected Output of Removal Script

```json
[
  {
    "archived_products": 40,
    "deactivated_variants": 66,
    "suspended_sellers": 3,
    "deleted_categories": 10,
    "deleted_brands": 6,
    "deactivated_banners": 3,
    "banned_users": 3
  }
]
```
