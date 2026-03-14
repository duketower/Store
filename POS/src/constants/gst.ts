// GST rate slabs available in India
export const GST_SLABS = [0, 5, 12, 18, 28] as const
export type GstSlab = (typeof GST_SLABS)[number]

export const GST_SLAB_LABELS: Record<GstSlab, string> = {
  0: 'GST 0%',
  5: 'GST 5%',
  12: 'GST 12%',
  18: 'GST 18%',
  28: 'GST 28%',
}
