const TABLE_HEADER_HEIGHT = 46

/** 至少 minRows 行可视高度；数据更多时在表格内滚动。 */
export function resolveTableHeight(rowCount: number, rowHeight: number, minRows = 10) {
  const visibleRows = rowCount > minRows ? minRows : Math.max(minRows, rowCount)
  return TABLE_HEADER_HEIGHT + visibleRows * rowHeight
}

export function resolveTableBodyMinHeight(rowHeight: number, minRows = 10) {
  return minRows * rowHeight
}
