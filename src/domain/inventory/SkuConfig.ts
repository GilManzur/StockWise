/**
 * SkuConfig — product SKU stored in Firestore.
 *
 * Firestore path:
 *   networks/{networkId}/locations/{locationId}/skus/{skuId}
 */
export interface SkuConfig {
  skuId: string;

  /** Product display name */
  name: string;

  /** Weight of a single unit in grams */
  unitWeightG: number;

  /** Acceptable weight tolerance in grams */
  toleranceG: number;

  /** Packaging weight in grams (subtracted from gross) */
  packagingWeightG: number;

  /** Whether this SKU is actively in use */
  active: boolean;
}
