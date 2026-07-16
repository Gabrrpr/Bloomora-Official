# Mobile Home Feed Algorithms

The mobile Home feed uses three product rankings: **Explore**, **What's New**, and **For You**.

The implementation is in `app/services/mobile_recommendations.py`. The mobile feed route calls the service and handles authentication, pagination, campaigns, reactions, and analytics separately.

The web recommendation endpoint is not used or changed by this service.

## Request flow

```text
Mobile Home screen
    -> GET /api/v1/mobile-feed?tab={tab}&branch={branch}
    -> mobile_feed.py validates the request
    -> mobile_recommendations.py filters and ranks products
    -> mobile_feed.py paginates the ranked results
    -> Mobile renders product feed cards
```

## Shared product filters

Every tab starts with products that are:

- available;
- visible;
- not inactive;
- assigned to the selected branch;
- in stock at the selected branch; and
- inside their limited availability dates, when dates are set.

These checks are handled by `eligible_products()`.

## Explore

Explore gives more weight to products that are already performing well.

```text
score = popularity × 0.48
      + rating × 0.32
      + recency × 0.20
```

- `popularity` is the product's sold count divided by the highest sold count in the eligible catalog.
- `rating` is the average rating divided by five.
- `recency` decreases as a product gets older.

Explore uses a stable branch-based tie-breaker. Products with equal scores keep a consistent order for the same branch.

## What's New

What's New gives most of its weight to product age.

```text
score = recency × 0.65
      + popularity × 0.20
      + rating × 0.15
```

Newer products receive a higher recency value. The newest creation date is used when products have equal scores.

## For You

For You uses completed or active paid orders as its main preference signal. Product names, categories, types, descriptions, tags, and occasions are converted into TF-IDF values and compared with the user's purchase profile using cosine similarity.

When usable purchase history exists:

```text
score = purchase content similarity × 0.60
      + wishlist category match × 0.15
      + popularity × 0.10
      + rating × 0.10
      + recency × 0.05
```

Products the user has not purchased are placed before previous purchases. Previous purchases remain available as a fallback when there are not enough unseen products.

When there is no usable purchase history but wishlist preferences exist:

```text
score = wishlist category match × 0.40
      + popularity × 0.28
      + rating × 0.22
      + recency × 0.10
```

When the user is signed out or has neither purchase nor wishlist preferences:

```text
score = popularity × 0.55
      + rating × 0.25
      + recency × 0.20
```

The tab shows bouquets first, followed by gift and add-on products. Sensitive and event-display products are excluded from this tab. The product groups are handled by `for_you_product_bucket()`.

For You uses the user ID for stable tie-breaking when the user is signed in. Guests use the selected branch.

## Main functions

| Function | Purpose |
| --- | --- |
| `rank_mobile_feed_products()` | Loads data, calculates scores, sorts products, and returns feed entries. |
| `eligible_products()` | Applies availability, branch, stock, date, and For You filters. |
| `product_score()` | Calculates the score for the selected tab. |
| `purchase_similarity_scores()` | Compares available products with the user's purchase profile. |
| `for_you_product_bucket()` | Groups allowed For You products and excludes sensitive products. |
| `product_tie_breaker()` | Produces a stable order when scores are equal. |
| `serialize_product()` | Converts a product into the mobile feed response format. |

## Changing weights

The weights are in `product_score()`. Keep the weights for each scoring path at a total of `1.00` so scores remain easy to compare.

After changing filters or weights, run:

```powershell
python -m unittest tests.test_mobile_feed_helpers
```
